import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from '../products.service';
import { PrismaService } from '../../prisma/prisma.service';

// Mock de los helpers
jest.mock('../helpers/product-stock.helper');
jest.mock('../helpers/product-validation.helper');

import { ProductStockHelper } from '../helpers/product-stock.helper';
import { ProductValidationHelper } from '../helpers/product-validation.helper';

describe('ProductService', () => {
  let service: ProductService;
  let prisma: any;

  const mockPrisma = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    inventoryMovement: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const createData = {
        name: 'Collar Artesanal',
        price: 15000,
        artisanId: 1,
        eventId: 1,
        initialQuantity: 10,
      };

      const product = {
        id: 1,
        name: 'Collar Artesanal',
        price: 15000,
        artisanId: 1,
        eventId: 1,
      };

      // Mock del helper de stock
      (ProductStockHelper.getCurrentStockWithClient as jest.Mock).mockResolvedValue(10);

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          product: { create: jest.fn().mockResolvedValue(product) },
          inventoryMovement: { create: jest.fn() },
        };
        return callback(mockTx);
      });

      const result = await service.create(createData);

      expect(result).toEqual({ ...product, stock: 10 });
    });
  });

  describe('findAll', () => {
    it('should return all products with stock', async () => {
      const products = [
        { id: 1, name: 'Producto A', eventId: 1, artisanId: 1 },
        { id: 2, name: 'Producto B', eventId: 1, artisanId: 2 },
      ];

      const productsWithStock = [
        { id: 1, name: 'Producto A', eventId: 1, artisanId: 1, stock: 8 },
        { id: 2, name: 'Producto B', eventId: 1, artisanId: 2, stock: 10 },
      ];

      mockPrisma.product.findMany.mockResolvedValue(products);
      (ProductStockHelper.addStockToProducts as jest.Mock).mockResolvedValue(productsWithStock);

      const result = await service.findAll({ eventId: 1 });

      expect(result).toEqual(productsWithStock);
    });
  });

  describe('findOne', () => {
    it('should find product by id with stock', async () => {
      const product = {
        id: 1,
        name: 'Producto Test',
        eventId: 1,
        artisanId: 1,
      };
      const productWithStock = { ...product, stock: 5 };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      (ProductStockHelper.addStockToProduct as jest.Mock).mockResolvedValue(productWithStock);

      const result = await service.findOne(1);

      expect(result).toEqual(productWithStock);
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const updateData = { name: 'Producto Actualizado' };
      const existingProduct = {
        id: 1,
        name: 'Producto Test',
        eventId: 1,
        artisanId: 1,
      };
      const updatedProduct = { ...existingProduct, ...updateData };
      const productWithStock = { ...updatedProduct, stock: 5 };

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.update.mockResolvedValue(updatedProduct);
      (ProductStockHelper.addStockToProduct as jest.Mock).mockResolvedValue(productWithStock);

      const result = await service.update(1, updateData);

      expect(result).toEqual(productWithStock);
    });
  });

  describe('remove', () => {
    it('should remove product when no dependencies exist', async () => {
      const product = { id: 1, name: 'Producto Test', eventId: 1 };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.inventoryMovement.count.mockResolvedValue(0);
      mockPrisma.product.delete.mockResolvedValue(product);

      const result = await service.remove(1);

      expect(result).toEqual(product);
    });

    it('should throw error when product has inventory movements', async () => {
      const product = { id: 1, name: 'Producto Test', eventId: 1 };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.inventoryMovement.count.mockResolvedValue(5);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCurrentStock', () => {
    it('should calculate current stock correctly', async () => {
      (ProductStockHelper.getCurrentStock as jest.Mock).mockResolvedValue(15);

      const result = await service.getCurrentStock(1);

      expect(result).toBe(15);
    });
  });
});
