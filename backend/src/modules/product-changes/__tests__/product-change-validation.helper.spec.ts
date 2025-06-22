import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductChangeValidationHelper } from '../helpers/product-change-validation.helper';
import { CreateProductChangeInput } from '../types/product-change.types';

// Mock the event status util
jest.mock('../../events/utils/event-status.util', () => ({
  getEventStatus: jest.fn(),
}));

import { getEventStatus } from '../../events/utils/event-status.util';

describe('ProductChangeValidationHelper', () => {
  const mockPrismaService = {
    sale: {
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    productChange: {
      findFirst: jest.fn(),
    },
    inventoryMovement: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCreateProductChangeInput', () => {
    it('should pass validation for valid input', () => {
      const input: CreateProductChangeInput = {
        saleId: 1,
        productReturnedId: 2,
        productDeliveredId: 3,
        quantity: 1,
        paymentMethodDifference: 'CARD',
        cardFeeDifference: 1.5,
      };

      const result = ProductChangeValidationHelper.validateCreateProductChangeInput(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when products are the same', () => {
      const input: CreateProductChangeInput = {
        saleId: 1,
        productReturnedId: 2,
        productDeliveredId: 2, // Same as returned
        quantity: 1,
      };

      const result = ProductChangeValidationHelper.validateCreateProductChangeInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El producto devuelto y el producto entregado deben ser diferentes');
    });

    it('should fail when payment method is CARD but no card fee', () => {
      const input: CreateProductChangeInput = {
        saleId: 1,
        productReturnedId: 2,
        productDeliveredId: 3,
        quantity: 1,
        paymentMethodDifference: 'CARD',
        // Missing cardFeeDifference
      };

      const result = ProductChangeValidationHelper.validateCreateProductChangeInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Si el método de pago es CARD, debe especificar el fee de tarjeta');
    });

    it('should fail when card fee is specified but payment method is not CARD', () => {
      const input: CreateProductChangeInput = {
        saleId: 1,
        productReturnedId: 2,
        productDeliveredId: 3,
        quantity: 1,
        paymentMethodDifference: 'CASH',
        cardFeeDifference: 1.5, // Shouldn't be specified for CASH
      };

      const result = ProductChangeValidationHelper.validateCreateProductChangeInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Solo se puede especificar fee de tarjeta si el método de pago es CARD');
    });
  });

  describe('validateSale', () => {
    const mockSale = {
      id: 1,
      state: 'ACTIVE',
      event: { id: 1, name: 'Test Event' },
      artisan: { id: 1, name: 'Test Artisan' },
      product: { id: 1, name: 'Test Product' },
    };

    beforeEach(() => {
      (getEventStatus as jest.Mock).mockReturnValue('ACTIVE');
    });

    it('should return sale when valid', async () => {
      mockPrismaService.sale.findUnique.mockResolvedValue(mockSale);

      const result = await ProductChangeValidationHelper.validateSale(
        mockPrismaService as any,
        1
      );

      expect(result).toEqual(mockSale);
    });

    it('should throw NotFoundException when sale not found', async () => {
      mockPrismaService.sale.findUnique.mockResolvedValue(null);

      await expect(
        ProductChangeValidationHelper.validateSale(mockPrismaService as any, 999)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when sale is not active', async () => {
      const inactiveSale = { ...mockSale, state: 'CHANGED' };
      mockPrismaService.sale.findUnique.mockResolvedValue(inactiveSale);

      await expect(
        ProductChangeValidationHelper.validateSale(mockPrismaService as any, 1)
      ).rejects.toThrow('La venta ya fue cambiada o cancelada');
    });

    it('should throw BadRequestException when event is not active', async () => {
      mockPrismaService.sale.findUnique.mockResolvedValue(mockSale);
      (getEventStatus as jest.Mock).mockReturnValue('INACTIVE');

      await expect(
        ProductChangeValidationHelper.validateSale(mockPrismaService as any, 1)
      ).rejects.toThrow('Solo se pueden registrar cambios de producto cuando el evento está en curso');
    });
  });

  describe('validateProducts', () => {
    const mockProductReturned = {
      id: 2,
      price: 50,
      eventId: 1,
      artisanId: 1,
      artisan: { name: 'Test Artisan' },
    };

    const mockProductDelivered = {
      id: 3,
      price: 70,
      eventId: 1,
      artisanId: 1,
      artisan: { name: 'Test Artisan' },
    };

    it('should return products when valid', async () => {
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(mockProductReturned)
        .mockResolvedValueOnce(mockProductDelivered);

      const result = await ProductChangeValidationHelper.validateProducts(
        mockPrismaService as any,
        2,
        3,
        1,
        1
      );

      expect(result.productReturned).toEqual(mockProductReturned);
      expect(result.productDelivered).toEqual(mockProductDelivered);
    });

    it('should throw NotFoundException when returned product not found', async () => {
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockProductDelivered);

      await expect(
        ProductChangeValidationHelper.validateProducts(
          mockPrismaService as any,
          999,
          3,
          1,
          1
        )
      ).rejects.toThrow('Producto devuelto no encontrado');
    });

    it('should throw NotFoundException when delivered product not found', async () => {
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(mockProductReturned)
        .mockResolvedValueOnce(null);

      await expect(
        ProductChangeValidationHelper.validateProducts(
          mockPrismaService as any,
          2,
          999,
          1,
          1
        )
      ).rejects.toThrow('Producto a entregar no encontrado');
    });

    it('should throw BadRequestException when products belong to different events', async () => {
      const wrongEventProduct = { ...mockProductDelivered, eventId: 2 };
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(mockProductReturned)
        .mockResolvedValueOnce(wrongEventProduct);

      await expect(
        ProductChangeValidationHelper.validateProducts(
          mockPrismaService as any,
          2,
          3,
          1,
          1
        )
      ).rejects.toThrow('Los productos deben pertenecer al mismo evento y artesano que la venta original');
    });

    it('should throw BadRequestException when products belong to different artisans', async () => {
      const wrongArtisanProduct = { ...mockProductDelivered, artisanId: 2 };
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(mockProductReturned)
        .mockResolvedValueOnce(wrongArtisanProduct);

      await expect(
        ProductChangeValidationHelper.validateProducts(
          mockPrismaService as any,
          2,
          3,
          1,
          1
        )
      ).rejects.toThrow('Los productos deben pertenecer al mismo evento y artesano que la venta original');
    });
  });

  describe('validateNoDuplicateChange', () => {
    it('should pass when no existing change found', async () => {
      mockPrismaService.productChange.findFirst.mockResolvedValue(null);

      await expect(
        ProductChangeValidationHelper.validateNoDuplicateChange(
          mockPrismaService as any,
          1
        )
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException when duplicate change exists', async () => {
      const existingChange = { id: 1, saleId: 1 };
      mockPrismaService.productChange.findFirst.mockResolvedValue(existingChange);

      await expect(
        ProductChangeValidationHelper.validateNoDuplicateChange(
          mockPrismaService as any,
          1
        )
      ).rejects.toThrow('Ya existe un cambio registrado para esta venta');
    });
  });

  describe('validateQuantity', () => {
    it('should pass when quantity is valid', () => {
      expect(() => 
        ProductChangeValidationHelper.validateQuantity(1, 2)
      ).not.toThrow();
    });

    it('should throw BadRequestException when quantity exceeds sold', () => {
      expect(() => 
        ProductChangeValidationHelper.validateQuantity(3, 2)
      ).toThrow('No se pueden cambiar 3 unidades. Solo se vendieron 2 unidades');
    });
  });

  describe('validateStock', () => {
    it('should return available stock when sufficient', async () => {
      mockPrismaService.inventoryMovement.aggregate.mockResolvedValue({
        _sum: { quantity: 10 },
      });

      const result = await ProductChangeValidationHelper.validateStock(
        mockPrismaService as any,
        1,
        5
      );

      expect(result).toBe(10);
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      mockPrismaService.inventoryMovement.aggregate.mockResolvedValue({
        _sum: { quantity: 2 },
      });

      await expect(
        ProductChangeValidationHelper.validateStock(
          mockPrismaService as any,
          1,
          5
        )
      ).rejects.toThrow('Stock insuficiente. Disponible: 2, Requerido: 5');
    });

    it('should handle null stock result', async () => {
      mockPrismaService.inventoryMovement.aggregate.mockResolvedValue({
        _sum: { quantity: null },
      });

      await expect(
        ProductChangeValidationHelper.validateStock(
          mockPrismaService as any,
          1,
          1
        )
      ).rejects.toThrow('Stock insuficiente. Disponible: 0, Requerido: 1');
    });
  });

  describe('calculateProductChangeValues', () => {
    it('should calculate values correctly for valid change', () => {
      const result = ProductChangeValidationHelper.calculateProductChangeValues(
        50,  // returned price
        70,  // delivered price
        2,   // quantity
        'CARD',
        1.5
      );

      expect(result.deliveredProductPrice).toBe(70);
      expect(result.valueDifference).toBe(40); // (70-50) * 2
      expect(result.isValidChange).toBe(true);
    });

    it('should handle zero difference correctly', () => {
      const result = ProductChangeValidationHelper.calculateProductChangeValues(
        50,  // returned price
        50,  // delivered price (same)
        1,   // quantity
      );

      expect(result.valueDifference).toBe(0);
      expect(result.isValidChange).toBe(true);
    });

    it('should reject changes with negative value difference', () => {
      const result = ProductChangeValidationHelper.calculateProductChangeValues(
        70,  // returned price
        50,  // delivered price (lower)
        1,   // quantity
      );

      expect(result.isValidChange).toBe(false);
      expect(result.errorMessage).toBe('No se permite cambiar por un producto de menor valor');
    });

    it('should require card fee for CARD payments with difference', () => {
      const result = ProductChangeValidationHelper.calculateProductChangeValues(
        50,   // returned price
        70,   // delivered price
        1,    // quantity
        'CARD' // payment method
        // missing cardFeeDifference
      );

      expect(result.isValidChange).toBe(false);
      expect(result.errorMessage).toBe('Debe especificar el fee de tarjeta para pagos con tarjeta');
    });
  });
  describe('calculateProductChangeStats', () => {
    const mockChanges = [
      {
        valueDifference: 20,
        cardFeeDifference: 1.5,
        paymentMethodDifference: 'CARD',
      },
      {
        valueDifference: 0,
        cardFeeDifference: null,
        paymentMethodDifference: null,
      },
      {
        valueDifference: 10,
        cardFeeDifference: null,
        paymentMethodDifference: 'CASH',
      },
    ];

    it('should calculate stats correctly', async () => {
      const mockPrismaWithStats = {
        ...mockPrismaService,
        productChange: {
          ...mockPrismaService.productChange,
          findMany: jest.fn().mockResolvedValue(mockChanges),
        },
      };

      const result = await ProductChangeValidationHelper.calculateProductChangeStats(
        mockPrismaWithStats as any,
        1
      );

      expect(result.totalChanges).toBe(3);
      expect(result.totalValueDifference).toBe(30);
      expect(result.totalCardFees).toBe(1.5);
      expect(result.changesByPaymentMethod.cash).toBe(2); // null/CASH
      expect(result.changesByPaymentMethod.card).toBe(1);
    });
  });
});
