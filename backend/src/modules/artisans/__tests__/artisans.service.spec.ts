import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ArtisanService } from '../artisans.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ArtisanService', () => {
  let service: ArtisanService;
  let prisma: any;
  let validationHelper: any;

  // Mock simple de PrismaService
  const mockPrisma = {
    artisan: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    sale: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    inventoryMovement: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    productChange: {
      findMany: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
  };

  const mockArtisan = {
    id: 1,
    name: 'Juan Pérez',
    identification: '12345678',
    active: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtisanService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();
    service = module.get<ArtisanService>(ArtisanService);
    prisma = module.get<PrismaService>(PrismaService);

    // Mock del validation helper manualmente
    validationHelper = {
      validateUniqueIdentification: jest.fn(),
      validateArtisanExists: jest.fn(),
      validateCanDeactivate: jest.fn(),
    };

    // Reemplazar el helper del servicio con nuestro mock
    (service as any).validationHelper = validationHelper;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an artisan successfully', async () => {
      const createData = {
        name: 'Juan Pérez',
        identification: '12345678',
        active: true,
      };

      validationHelper.validateUniqueIdentification.mockResolvedValue(
        undefined,
      );
      mockPrisma.artisan.create.mockResolvedValue(mockArtisan);

      const result = await service.create(createData);

      expect(
        validationHelper.validateUniqueIdentification,
      ).toHaveBeenCalledWith('12345678');
      expect(mockPrisma.artisan.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toEqual(mockArtisan);
    });

    it('should handle unique constraint violation', async () => {
      const createData = {
        name: 'Juan Pérez',
        identification: '12345678',
        active: true,
      };
      const error = { code: 'P2002', meta: { target: ['identification'] } };

      validationHelper.validateUniqueIdentification.mockResolvedValue(
        undefined,
      );
      mockPrisma.artisan.create.mockRejectedValue(error);

      await expect(service.create(createData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all artisans', async () => {
      const artisans = [mockArtisan];
      mockPrisma.artisan.findMany.mockResolvedValue(artisans);

      const result = await service.findAll();

      expect(mockPrisma.artisan.findMany).toHaveBeenCalled();
      expect(result).toEqual(artisans);
    });
  });

  describe('findOne', () => {
    it('should return an artisan when found', async () => {
      validationHelper.validateArtisanExists.mockResolvedValue(undefined);
      mockPrisma.artisan.findUnique.mockResolvedValue(mockArtisan);

      const result = await service.findOne(1);

      expect(validationHelper.validateArtisanExists).toHaveBeenCalledWith(1);
      expect(mockPrisma.artisan.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockArtisan);
    });

    it('should handle validation error', async () => {
      validationHelper.validateArtisanExists.mockRejectedValue(
        new NotFoundException('Artesano no encontrado'),
      );

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an artisan when no sales exist', async () => {
      const updateData = { name: 'Juan Carlos Pérez' };
      const updatedArtisan = { ...mockArtisan, name: 'Juan Carlos Pérez' };

      validationHelper.validateArtisanExists.mockResolvedValue(undefined);
      mockPrisma.artisan.findUnique.mockResolvedValue(mockArtisan);
      mockPrisma.sale.count.mockResolvedValue(0);
      mockPrisma.artisan.update.mockResolvedValue(updatedArtisan);

      const result = await service.update(1, updateData);

      expect(validationHelper.validateArtisanExists).toHaveBeenCalledWith(1);
      expect(mockPrisma.sale.count).toHaveBeenCalledWith({
        where: { artisanId: 1 },
      });
      expect(result).toEqual(updatedArtisan);
    });

    it('should allow status change for artisan with sales', async () => {
      const updateData = { active: false };
      const updatedArtisan = { ...mockArtisan, active: false };

      validationHelper.validateArtisanExists.mockResolvedValue(undefined);
      mockPrisma.artisan.findUnique.mockResolvedValue(mockArtisan);
      mockPrisma.sale.count.mockResolvedValue(1);
      validationHelper.validateCanDeactivate.mockResolvedValue(undefined);
      mockPrisma.artisan.update.mockResolvedValue(updatedArtisan);

      const result = await service.update(1, updateData);

      expect(validationHelper.validateCanDeactivate).toHaveBeenCalledWith(1);
      expect(result).toEqual(updatedArtisan);
    });

    it('should prevent non-status updates when artisan has sales', async () => {
      const updateData = { name: 'Nuevo Nombre' };

      validationHelper.validateArtisanExists.mockResolvedValue(undefined);
      mockPrisma.artisan.findUnique.mockResolvedValue(mockArtisan);
      mockPrisma.sale.count.mockResolvedValue(1);

      await expect(service.update(1, updateData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an artisan successfully', async () => {
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.sale.count.mockResolvedValue(0);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.artisan.delete.mockResolvedValue(mockArtisan);

      const result = await service.remove(1);

      expect(mockPrisma.product.count).toHaveBeenCalledWith({
        where: { artisanId: 1 },
      });
      expect(mockPrisma.sale.count).toHaveBeenCalledWith({
        where: { artisanId: 1 },
      });
      expect(result).toEqual(mockArtisan);
    });

    it('should prevent deletion when artisan has products', async () => {
      mockPrisma.product.count.mockResolvedValue(1);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it('should prevent deletion when artisan has sales', async () => {
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.sale.count.mockResolvedValue(1);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it('should handle artisan not found', async () => {
      const error = { code: 'P2025' };

      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.sale.count.mockResolvedValue(0);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.artisan.delete.mockRejectedValue(error);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummaryByEvent', () => {
    it('should return artisan summary for event', async () => {
      const event = { id: 1, name: 'Test Event' };
      const products = [{ id: 1, name: 'Product 1', price: 100 }];
      const sales = [{ id: 1, quantitySold: 2 }];
      const movements = [{ productId: 1, type: 'ENTRADA', quantity: 10 }];

      mockPrisma.event.findUnique.mockResolvedValue(event);
      mockPrisma.artisan.findUnique.mockResolvedValue(mockArtisan);
      mockPrisma.product.findMany.mockResolvedValue(products);
      mockPrisma.sale.findMany.mockResolvedValue(sales);
      mockPrisma.inventoryMovement.findMany.mockResolvedValue(movements);

      const result = await service.getSummaryByEvent(1, 1);

      expect(result).toBeDefined();
      expect(result.artisanId).toBe(1);
      expect(result.artisanName).toBe('Juan Pérez');
    });

    it('should throw error when event not found', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.getSummaryByEvent(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when artisan not found', async () => {
      const event = { id: 1, name: 'Test Event' };
      mockPrisma.event.findUnique.mockResolvedValue(event);
      mockPrisma.artisan.findUnique.mockResolvedValue(null);

      await expect(service.getSummaryByEvent(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
