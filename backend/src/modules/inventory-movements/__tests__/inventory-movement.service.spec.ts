import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryMovementService } from '../inventory-movement.service';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryMovementValidationHelper } from '../helpers/inventory-movement-validation.helper';
import { CreateInventoryMovementDto } from '../dto/inventory-movement.dto';
import { InventoryMovementResponseEntity, InventoryMovementDetailedResponseEntity } from '../entities/inventory-movement-response.entity';

// Mock del helper de validación
jest.mock('../helpers/inventory-movement-validation.helper');

describe('InventoryMovementService', () => {
  let service: InventoryMovementService;
  let prismaService: any;

  const mockPrismaService = {
    inventoryMovement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    sale: {
      findUnique: jest.fn(),
    },
    productChange: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryMovementService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InventoryMovementService>(InventoryMovementService);
    prismaService = module.get(PrismaService);

    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateInventoryMovementDto = {
      type: 'ENTRADA',
      quantity: 5,
      reason: 'Carga inicial',
      productId: 1,
    };

    const mockValidationResult = {
      product: {
        id: 1,
        name: 'Producto Test',
        price: 10000,
        artisanId: 1,
        eventId: 1,
      },
      sale: null,
      change: null,
    };

    const mockCreatedMovement = {
      id: 1,
      type: 'ENTRADA',
      quantity: 5,
      reason: 'Carga inicial',
      productId: 1,
      saleId: null,
      changeId: null,
      createdAt: new Date('2025-06-22T10:30:00Z'),
    };

    it('should create a movement successfully', async () => {
      // Arrange
      (InventoryMovementValidationHelper.validateCompleteMovement as jest.Mock)
        .mockResolvedValue(mockValidationResult);
      prismaService.inventoryMovement.create.mockResolvedValue(mockCreatedMovement);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(InventoryMovementValidationHelper.validateCompleteMovement)
        .toHaveBeenCalledWith(prismaService, createDto);
      expect(prismaService.inventoryMovement.create).toHaveBeenCalledWith({
        data: {
          type: createDto.type,
          quantity: createDto.quantity,
          reason: createDto.reason,
          productId: createDto.productId,
          saleId: createDto.saleId,
          changeId: createDto.changeId,
        },
      });
      expect(result).toBeInstanceOf(InventoryMovementResponseEntity);
      expect(result.id).toBe(1);
      expect(result.type).toBe('ENTRADA');
    });

    it('should throw validation error when validation fails', async () => {
      // Arrange
      (InventoryMovementValidationHelper.validateCompleteMovement as jest.Mock)
        .mockRejectedValue(new BadRequestException('Stock insuficiente'));

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(prismaService.inventoryMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const filters = {
      page: 1,
      limit: 10,
      type: 'ENTRADA' as const,
      productId: 1,
    };

    const mockMovements = [
      {
        id: 1,
        type: 'ENTRADA',
        quantity: 5,
        reason: 'Carga inicial',
        productId: 1,
        saleId: null,
        changeId: null,
        createdAt: new Date('2025-06-22T10:30:00Z'),
        product: {
          id: 1,
          name: 'Producto Test',
          price: 10000,
          artisan: { name: 'Artesano Test' },
          event: { name: 'Evento Test' },
        },
        sale: null,
        change: null,
      },
    ];

    it('should return paginated movements', async () => {
      // Arrange
      (InventoryMovementValidationHelper.validatePagination as jest.Mock)
        .mockReturnValue(undefined);
      prismaService.inventoryMovement.findMany.mockResolvedValue(mockMovements);
      prismaService.inventoryMovement.count.mockResolvedValue(25);

      // Act
      const result = await service.findAll(filters);

      // Assert
      expect(InventoryMovementValidationHelper.validatePagination)
        .toHaveBeenCalledWith(filters.page, filters.limit);
      expect(prismaService.inventoryMovement.findMany).toHaveBeenCalledWith({
        where: {
          productId: 1,
          type: 'ENTRADA',
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
      expect(result.movements).toHaveLength(1);
      expect(result.movements[0]).toBeInstanceOf(InventoryMovementDetailedResponseEntity);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('should validate date range when provided', async () => {
      // Arrange
      const filtersWithDates = {
        ...filters,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      (InventoryMovementValidationHelper.validateDateRange as jest.Mock)
        .mockReturnValue(undefined);
      (InventoryMovementValidationHelper.validatePagination as jest.Mock)
        .mockReturnValue(undefined);
      prismaService.inventoryMovement.findMany.mockResolvedValue([]);
      prismaService.inventoryMovement.count.mockResolvedValue(0);

      // Act
      await service.findAll(filtersWithDates);

      // Assert
      expect(InventoryMovementValidationHelper.validateDateRange)
        .toHaveBeenCalledWith('2024-01-01', '2024-12-31');
    });

    it('should apply complex filters correctly', async () => {
      // Arrange
      const complexFilters = {
        page: 1,
        limit: 10,
        productId: 1,
        type: 'SALIDA' as const,
        saleId: 2,
        eventId: 3,
        artisanId: 4,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      (InventoryMovementValidationHelper.validateDateRange as jest.Mock)
        .mockReturnValue(undefined);
      (InventoryMovementValidationHelper.validatePagination as jest.Mock)
        .mockReturnValue(undefined);
      prismaService.inventoryMovement.findMany.mockResolvedValue([]);
      prismaService.inventoryMovement.count.mockResolvedValue(0);

      // Act
      await service.findAll(complexFilters);

      // Assert
      expect(prismaService.inventoryMovement.findMany).toHaveBeenCalledWith({
        where: {
          productId: 1,
          type: 'SALIDA',
          saleId: 2,
          product: {
            eventId: 3,
            artisanId: 4,
          },
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31'),
          },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    const mockMovement = {
      id: 1,
      type: 'ENTRADA',
      quantity: 5,
      reason: 'Carga inicial',
      productId: 1,
      saleId: null,
      changeId: null,
      createdAt: new Date('2025-06-22T10:30:00Z'),
      product: {
        id: 1,
        name: 'Producto Test',
        price: 10000,
        artisan: { name: 'Artesano Test' },
        event: { name: 'Evento Test' },
      },
      sale: null,
      change: null,
    };

    it('should return movement when found', async () => {
      // Arrange
      prismaService.inventoryMovement.findUnique.mockResolvedValue(mockMovement);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(prismaService.inventoryMovement.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
      expect(result).toBeInstanceOf(InventoryMovementDetailedResponseEntity);
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException when movement not found', async () => {
      // Arrange
      prismaService.inventoryMovement.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(prismaService.inventoryMovement.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: expect.any(Object),
      });
    });
  });

  describe('getCurrentStock', () => {
    it('should calculate current stock correctly', async () => {
      // Arrange
      (InventoryMovementValidationHelper.calculateCurrentStock as jest.Mock)
        .mockResolvedValue(15);

      // Act
      const result = await service.getCurrentStock(1);

      // Assert
      expect(InventoryMovementValidationHelper.calculateCurrentStock)
        .toHaveBeenCalledWith(prismaService, 1);
      expect(result).toBe(15);
    });
  });

  describe('getStats', () => {
    const filters = {
      eventId: 1,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };

    it('should return movement statistics', async () => {
      // Arrange
      (InventoryMovementValidationHelper.validateDateRange as jest.Mock)
        .mockReturnValue(undefined);
      prismaService.inventoryMovement.count
        .mockResolvedValueOnce(100) // total movements
        .mockResolvedValueOnce(60)  // entradas
        .mockResolvedValueOnce(40); // salidas
      prismaService.inventoryMovement.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 300 } }) // entradas quantity
        .mockResolvedValueOnce({ _sum: { quantity: 200 } }); // salidas quantity

      // Act
      const result = await service.getStats(filters);

      // Assert
      expect(InventoryMovementValidationHelper.validateDateRange)
        .toHaveBeenCalledWith('2024-01-01', '2024-12-31');
      expect(result).toEqual({
        totalMovements: 100,
        totalEntradas: 60,
        totalSalidas: 40,
        totalQuantityEntradas: 300,
        totalQuantitySalidas: 200,
        netQuantity: 100,
      });
    });

    it('should handle null aggregation results', async () => {
      // Arrange
      (InventoryMovementValidationHelper.validateDateRange as jest.Mock)
        .mockReturnValue(undefined);
      prismaService.inventoryMovement.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prismaService.inventoryMovement.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: null } })
        .mockResolvedValueOnce({ _sum: { quantity: null } });

      // Act
      const result = await service.getStats({});

      // Assert
      expect(result).toEqual({
        totalMovements: 0,
        totalEntradas: 0,
        totalSalidas: 0,
        totalQuantityEntradas: 0,
        totalQuantitySalidas: 0,
        netQuantity: 0,
      });
    });
  });
});
