import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductService } from '../../src/modules/products/products.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { IntegrationTestSetup, TestDataFactory } from './test-setup';

/**
 * Pruebas de Integración para ProductService
 * Solo flujos de negocio críticos con BD real
 */
describe('ProductService - Integration', () => {
  let service: ProductService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await IntegrationTestSetup.setupTestModule([ProductService]);
    service = module.get<ProductService>(ProductService);
    prisma = IntegrationTestSetup.prisma;
  });

  beforeEach(async () => {
    await IntegrationTestSetup.cleanDatabase();
  });

  describe('Product Creation with Real DB Constraints', () => {
    it('should create product with initial inventory movement', async () => {
      // Create dependencies
      const event = await prisma.event.create({
        data: TestDataFactory.createEventData(),
      });
      const artisan = await prisma.artisan.create({
        data: TestDataFactory.createArtisanData(),
      });

      const productData = {
        name: 'Test Product',
        price: 150,
        eventId: event.id,
        artisanId: artisan.id,
        initialQuantity: 20,
      };

      const result = await service.create(productData);

      // Verify product created
      expect(result.name).toBe('Test Product');
      expect(result.price).toBe(150);
      expect(result.stock).toBe(20);

      // Verify initial inventory movement was created
      const movements = await prisma.inventoryMovement.findMany({
        where: { productId: result.id },
      });
      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('ENTRADA');
      expect(movements[0].quantity).toBe(20);
      expect(movements[0].reason).toBe('Carga inicial');
    });

    it('should enforce unique name per artisan-event constraint', async () => {
      const event = await prisma.event.create({
        data: TestDataFactory.createEventData(),
      });
      const artisan = await prisma.artisan.create({
        data: TestDataFactory.createArtisanData(),
      });

      const productData = {
        name: 'Duplicate Product',
        price: 100,
        eventId: event.id,
        artisanId: artisan.id,
        initialQuantity: 10,
      };

      // Create first product
      await service.create(productData);

      // Try to create duplicate
      await expect(service.create(productData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Stock Management Integration', () => {
    it('should calculate current stock correctly with multiple movements', async () => {
      // Setup
      const event = await prisma.event.create({
        data: TestDataFactory.createEventData(),
      });
      const artisan = await prisma.artisan.create({
        data: TestDataFactory.createArtisanData(),
      });

      const product = await service.create({
        name: 'Stock Test Product',
        price: 100,
        eventId: event.id,
        artisanId: artisan.id,
        initialQuantity: 50,
      });

      // Add more inventory
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'ENTRADA',
          quantity: 30,
          reason: 'Restock',
        },
      });

      // Remove some inventory (simulate sale)
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'SALIDA',
          quantity: 15,
          reason: 'Sale',
        },
      });

      const currentStock = await service.getCurrentStock(product.id);
      expect(currentStock).toBe(65); // 50 + 30 - 15
    });

    it('should handle event status validation for product creation', async () => {
      // Create closed event (past dates)
      const pastEvent = await prisma.event.create({
        data: TestDataFactory.createEventData({
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-02'),
        }),
      });
      const artisan = await prisma.artisan.create({
        data: TestDataFactory.createArtisanData(),
      });

      const productData = {
        name: 'Product for Closed Event',
        price: 100,
        eventId: pastEvent.id,
        artisanId: artisan.id,
        initialQuantity: 10,
      };

      // Should fail because event is not SCHEDULED
      await expect(service.create(productData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Product Business Rules', () => {
    it('should prevent product deletion when inventory movements exist', async () => {
      const event = await prisma.event.create({
        data: TestDataFactory.createEventData(),
      });
      const artisan = await prisma.artisan.create({
        data: TestDataFactory.createArtisanData(),
      });

      const product = await service.create({
        name: 'Product with Movements',
        price: 100,
        eventId: event.id,
        artisanId: artisan.id,
        initialQuantity: 10,
      });

      // Try to delete product that has movements
      await expect(service.remove(product.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
