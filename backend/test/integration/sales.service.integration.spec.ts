import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SaleService } from '../../src/modules/sales/sales.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { IntegrationTestSetup, TestDataFactory } from './test-setup';

/**
 * Pruebas de Integración para SaleService
 * Solo flujos de negocio críticos con BD real
 */
describe('SaleService - Integration', () => {
  let service: SaleService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await IntegrationTestSetup.setupTestModule([SaleService]);
    service = module.get<SaleService>(SaleService);
    prisma = IntegrationTestSetup.prisma;
  });

  beforeEach(async () => {
    await IntegrationTestSetup.cleanDatabase();
  });

  describe('Multi-Sale Creation with Real Business Rules', () => {
    it('should create multiple sales and update inventory correctly', async () => {
      // Setup: event, artisan, products with real inventory
      const event = await prisma.event.create({
        data: TestDataFactory.createEventData({
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Ends tomorrow
        }),
      });

      const artisan = await prisma.artisan.create({
        data: TestDataFactory.createArtisanData(),
      });

      // Create products with initial stock
      const product1 = await prisma.product.create({
        data: TestDataFactory.createProductData(artisan.id, event.id, {
          name: 'Product 1',
          price: 100,
        }),
      });

      const product2 = await prisma.product.create({
        data: TestDataFactory.createProductData(artisan.id, event.id, {
          name: 'Product 2',
          price: 150,
        }),
      });

      // Add initial inventory
      await prisma.inventoryMovement.createMany({
        data: [
          {
            productId: product1.id,
            type: 'ENTRADA',
            quantity: 20,
            reason: 'Stock inicial',
          },
          {
            productId: product2.id,
            type: 'ENTRADA',
            quantity: 15,
            reason: 'Stock inicial',
          },
        ],
      });

      // Create multi-sale
      const multiSaleData = {
        eventId: event.id,
        paymentMethod: 'CASH' as const,
        cardFeeTotal: 0,
        items: [
          { productId: product1.id, artisanId: artisan.id, quantitySold: 3 },
          { productId: product2.id, artisanId: artisan.id, quantitySold: 2 },
        ],
      };

      const result = await service.createMultiSale(multiSaleData);

      // Verify sales created
      expect(result).toHaveLength(2);
      expect(result[0].sale.valueCharged).toBe(300); // 100 * 3
      expect(result[1].sale.valueCharged).toBe(300); // 150 * 2

      // Verify inventory movements created (SALIDA)
      const movements = await prisma.inventoryMovement.findMany({
        where: {
          type: 'SALIDA',
          reason: 'Venta directa',
        },
      });
      expect(movements).toHaveLength(2);
      expect(movements.find((m) => m.productId === product1.id)?.quantity).toBe(
        3,
      );
      expect(movements.find((m) => m.productId === product2.id)?.quantity).toBe(
        2,
      );
    });

    it('should enforce stock validation in real transactions', async () => {
      const event = await prisma.event.create({
        data: TestDataFactory.createEventData({
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }),
      });

      const artisan = await prisma.artisan.create({
        data: TestDataFactory.createArtisanData(),
      });

      const product = await prisma.product.create({
        data: TestDataFactory.createProductData(artisan.id, event.id, {
          price: 100,
        }),
      });

      // Add limited stock
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'ENTRADA',
          quantity: 5,
          reason: 'Stock inicial',
        },
      });

      // Try to sell more than available
      const multiSaleData = {
        eventId: event.id,
        paymentMethod: 'CASH' as const,
        cardFeeTotal: 0,
        items: [
          { productId: product.id, artisanId: artisan.id, quantitySold: 10 }, // More than 5 available
        ],
      };

      await expect(service.createMultiSale(multiSaleData)).rejects.toThrow(
        BadRequestException,
      );

      // Verify no sale was created
      const sales = await prisma.sale.count();
      expect(sales).toBe(0);
    });

    it('should handle card fees correctly with real calculations', async () => {
      const event = await prisma.event.create({
        data: TestDataFactory.createEventData({
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }),
      });

      const artisan = await prisma.artisan.create({
        data: TestDataFactory.createArtisanData(),
      });

      const product1 = await prisma.product.create({
        data: TestDataFactory.createProductData(artisan.id, event.id, {
          price: 200,
        }),
      });

      const product2 = await prisma.product.create({
        data: TestDataFactory.createProductData(artisan.id, event.id, {
          name: 'Product 2',
          price: 100,
        }),
      });

      // Add stock
      await prisma.inventoryMovement.createMany({
        data: [
          {
            productId: product1.id,
            type: 'ENTRADA',
            quantity: 10,
            reason: 'Stock inicial',
          },
          {
            productId: product2.id,
            type: 'ENTRADA',
            quantity: 10,
            reason: 'Stock inicial',
          },
        ],
      });

      // Create card sale with fees
      const multiSaleData = {
        eventId: event.id,
        paymentMethod: 'CARD' as const,
        cardFeeTotal: 15, // Total fee for the transaction
        items: [
          { productId: product1.id, artisanId: artisan.id, quantitySold: 1 }, // 200
          { productId: product2.id, artisanId: artisan.id, quantitySold: 1 }, // 100
        ],
      };

      const result = await service.createMultiSale(multiSaleData);

      // Total sale = 300, fees should be prorated
      // Product1: 200/300 * 15 = 10
      // Product2: 100/300 * 15 = 5
      expect(result[0].sale.cardFee).toBeCloseTo(10, 2);
      expect(result[1].sale.cardFee).toBeCloseTo(5, 2);
    });
  });

  describe('Sale Cancellation with Inventory Recovery', () => {
    it('should cancel sale and return stock to inventory', async () => {
      // Setup active event and sale
      const event = await prisma.event.create({
        data: TestDataFactory.createEventData({
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }),
      });

      const artisan = await prisma.artisan.create({
        data: TestDataFactory.createArtisanData(),
      });

      const product = await prisma.product.create({
        data: TestDataFactory.createProductData(artisan.id, event.id),
      });

      // Add stock and create sale
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'ENTRADA',
          quantity: 20,
          reason: 'Stock inicial',
        },
      });

      const sale = await prisma.sale.create({
        data: TestDataFactory.createSaleData(artisan.id, product.id, event.id, {
          quantitySold: 5,
        }),
      });

      // Create original sale movement
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'SALIDA',
          quantity: 5,
          reason: 'Venta directa',
          saleId: sale.id,
        },
      });

      // Cancel sale
      const result = await service.cancelSale(sale.id);

      expect(result.sale.state).toBe('CANCELLED');

      // Verify inventory movement created for cancellation
      const returnMovement = await prisma.inventoryMovement.findFirst({
        where: {
          productId: product.id,
          type: 'ENTRADA',
          reason: 'Anulación de venta',
          saleId: sale.id,
        },
      });
      expect(returnMovement).toBeTruthy();
      expect(returnMovement?.quantity).toBe(5);
    });
  });
});
