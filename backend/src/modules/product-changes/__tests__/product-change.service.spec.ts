import { Test, TestingModule } from '@nestjs/testing';
import { ProductChangeService } from '../product-change.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductChangeValidationHelper } from '../helpers/product-change-validation.helper';
import { ProductChangeInventoryHelper } from '../helpers/product-change-inventory.helper';
import { CreateProductChangeInput } from '../types/product-change.types';

// Mock helpers
jest.mock('../helpers/product-change-validation.helper');
jest.mock('../helpers/product-change-inventory.helper');

describe('ProductChangeService', () => {
  let service: ProductChangeService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    productChange: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductChangeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductChangeService>(ProductChangeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockCreateInput: CreateProductChangeInput = {
      saleId: 1,
      productReturnedId: 2,
      productDeliveredId: 3,
      quantity: 1,
      paymentMethodDifference: 'CARD',
      cardFeeDifference: 1.5,
    };

    const mockValidationResult = {
      sale: {
        id: 1,
        quantitySold: 1,
        eventId: 1,
        artisanId: 1,
      },
      productReturned: { id: 2, price: 50 },
      productDelivered: { id: 3, price: 70 },
      calculation: {
        deliveredProductPrice: 70,
        valueDifference: 20,
        isValidChange: true,
      },
    };

    const mockCreatedChange = {
      id: 1,
      saleId: 1,
      productReturnedId: 2,
      productDeliveredId: 3,
      quantity: 1,
      deliveredProductPrice: 70,
      valueDifference: 20,
      paymentMethodDifference: 'CARD',
      cardFeeDifference: 1.5,
      createdAt: new Date(),
    };

    beforeEach(() => {
      (ProductChangeValidationHelper.validateCompleteProductChange as jest.Mock)
        .mockResolvedValue(mockValidationResult);
      (ProductChangeInventoryHelper.createInventoryMovements as jest.Mock)
        .mockResolvedValue(['Entrada creada', 'Salida creada']);
      (ProductChangeInventoryHelper.updateSaleStateIfNeeded as jest.Mock)
        .mockResolvedValue(['Estado actualizado']);
      
      mockPrismaService.$transaction.mockImplementation((callback) => 
        callback({
          productChange: {
            create: jest.fn().mockResolvedValue(mockCreatedChange),
          },
        })
      );
    });

    it('should create a product change successfully', async () => {
      const result = await service.create(mockCreateInput);

      expect(ProductChangeValidationHelper.validateCompleteProductChange)
        .toHaveBeenCalledWith(prismaService, mockCreateInput);
      expect(result.productChange.id).toBe(1);
      expect(result.message).toBe('Cambio de producto registrado exitosamente');
      expect(result.operations).toEqual(['Entrada creada', 'Salida creada', 'Estado actualizado']);
    });

    it('should validate product change before creating', async () => {
      await service.create(mockCreateInput);

      expect(ProductChangeValidationHelper.validateCompleteProductChange)
        .toHaveBeenCalledWith(prismaService, mockCreateInput);
    });

    it('should create inventory movements in transaction', async () => {
      await service.create(mockCreateInput);

      expect(ProductChangeInventoryHelper.createInventoryMovements)
        .toHaveBeenCalledWith(expect.any(Object), 1, 2, 3, 1);
    });

    it('should update sale state if needed', async () => {
      await service.create(mockCreateInput);

      expect(ProductChangeInventoryHelper.updateSaleStateIfNeeded)
        .toHaveBeenCalledWith(expect.any(Object), 1, 1, 1);
    });
  });

  describe('findOne', () => {
    const mockProductChange = {
      id: 1,
      saleId: 1,
      productReturnedId: 2,
      productDeliveredId: 3,
      quantity: 1,
      deliveredProductPrice: 70,
      valueDifference: 20,
      createdAt: new Date(),
    };

    it('should return a product change when found', async () => {
      mockPrismaService.productChange.findUnique.mockResolvedValue(mockProductChange);

      const result = await service.findOne(1);

      expect(mockPrismaService.productChange.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result.id).toBe(1);
      expect(result.saleId).toBe(1);
    });

    it('should throw error when product change not found', async () => {
      mockPrismaService.productChange.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow('Cambio de producto no encontrado');
    });
  });

  describe('findOneDetailed', () => {
    const mockDetailedChange = {
      id: 1,
      saleId: 1,
      productReturnedId: 2,
      productDeliveredId: 3,
      quantity: 1,
      deliveredProductPrice: 70,
      valueDifference: 20,
      createdAt: new Date(),
      sale: {
        id: 1,
        product: { name: 'Producto Original' },
        artisan: { name: 'Artesano Test' },
        event: { name: 'Evento Test' },
      },
      returnedProduct: {
        id: 2,
        name: 'Producto Devuelto',
        price: 50,
        artisan: { name: 'Artesano Test' },
      },
      deliveredProduct: {
        id: 3,
        name: 'Producto Entregado',
        price: 70,
        artisan: { name: 'Artesano Test' },
      },
    };

    it('should return detailed product change information', async () => {
      mockPrismaService.productChange.findUnique.mockResolvedValue(mockDetailedChange);

      const result = await service.findOneDetailed(1);

      expect(mockPrismaService.productChange.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          sale: {
            include: {
              product: { select: { name: true } },
              artisan: { select: { name: true } },
              event: { select: { name: true } }
            }
          },
          returnedProduct: {
            include: {
              artisan: { select: { name: true } }
            }
          },
          deliveredProduct: {
            include: {
              artisan: { select: { name: true } }
            }
          }
        },
      });
      expect(result.sale?.eventName).toBe('Evento Test');
      expect(result.returnedProduct?.name).toBe('Producto Devuelto');
    });
  });

  describe('findMany', () => {
    const mockChanges = [
      {
        id: 1,
        saleId: 1,
        productReturnedId: 2,
        productDeliveredId: 3,
        quantity: 1,
        deliveredProductPrice: 70,
        valueDifference: 20,
        createdAt: new Date(),
      },
      {
        id: 2,
        saleId: 2,
        productReturnedId: 4,
        productDeliveredId: 5,
        quantity: 2,
        deliveredProductPrice: 80,
        valueDifference: 10,
        createdAt: new Date(),
      },
    ];

    it('should return paginated list of product changes', async () => {
      mockPrismaService.productChange.findMany.mockResolvedValue(mockChanges);
      mockPrismaService.productChange.count.mockResolvedValue(2);

      const result = await service.findMany({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should apply filters correctly', async () => {
      mockPrismaService.productChange.findMany.mockResolvedValue([]);
      mockPrismaService.productChange.count.mockResolvedValue(0);

      await service.findMany({ 
        eventId: 1, 
        artisanId: 2, 
        saleId: 3,
        page: 1, 
        limit: 10 
      });

      expect(mockPrismaService.productChange.findMany).toHaveBeenCalledWith({
        where: {
          saleId: 3,
          sale: {
            eventId: 1,
            artisanId: 2,
          },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle empty query object', async () => {
      mockPrismaService.productChange.findMany.mockResolvedValue([]);
      mockPrismaService.productChange.count.mockResolvedValue(0);

      const result = await service.findMany();

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('findBySale', () => {
    const mockChanges = [
      {
        id: 1,
        saleId: 1,
        productReturnedId: 2,
        productDeliveredId: 3,
        quantity: 1,
        deliveredProductPrice: 70,
        valueDifference: 20,
        createdAt: new Date(),
      },
    ];

    it('should return changes for a specific sale', async () => {
      mockPrismaService.productChange.findMany.mockResolvedValue(mockChanges);

      const result = await service.findBySale(1);

      expect(mockPrismaService.productChange.findMany).toHaveBeenCalledWith({
        where: { saleId: 1 },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].saleId).toBe(1);
    });
  });

  describe('hasProductChanges', () => {
    it('should return true when sale has changes', async () => {
      mockPrismaService.productChange.count.mockResolvedValue(1);

      const result = await service.hasProductChanges(1);

      expect(mockPrismaService.productChange.count).toHaveBeenCalledWith({
        where: { saleId: 1 },
      });
      expect(result).toBe(true);
    });

    it('should return false when sale has no changes', async () => {
      mockPrismaService.productChange.count.mockResolvedValue(0);

      const result = await service.hasProductChanges(1);

      expect(result).toBe(false);
    });
  });

  describe('getEventStats', () => {
    it('should delegate to validation helper', async () => {
      const mockStats = {
        totalChanges: 5,
        totalValueDifference: 100,
        totalCardFees: 7.5,
        changesByPaymentMethod: { cash: 2, card: 3 },
      };

      (ProductChangeValidationHelper.calculateProductChangeStats as jest.Mock)
        .mockResolvedValue(mockStats);

      const result = await service.getEventStats(1);

      expect(ProductChangeValidationHelper.calculateProductChangeStats)
        .toHaveBeenCalledWith(prismaService, 1);
      expect(result).toEqual(mockStats);
    });
  });

  describe('getInventoryMovements', () => {
    it('should delegate to inventory helper', async () => {
      const mockMovements = [
        { id: 1, type: 'ENTRADA', quantity: 1, productId: 2 },
        { id: 2, type: 'SALIDA', quantity: 1, productId: 3 },
      ];

      (ProductChangeInventoryHelper.getMovementsByChange as jest.Mock)
        .mockResolvedValue(mockMovements);

      const result = await service.getInventoryMovements(1);

      expect(ProductChangeInventoryHelper.getMovementsByChange)
        .toHaveBeenCalledWith(prismaService, 1);
      expect(result).toEqual(mockMovements);
    });
  });
});
