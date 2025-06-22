import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SaleService } from '../sales.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSaleDto } from '../dto/create-sale.dto';
import { CreateMultiSaleDto } from '../dto/create-multi-sale.dto';
import { UpdateSaleDto } from '../dto/update-sale.dto';

describe('SaleService', () => {
  let service: SaleService;
  let prisma: any;

  const mockPrisma = {
    sale: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    artisan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    inventoryMovement: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEvent = {
    id: 1,
    name: 'Test Event',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
  };

  const mockArtisan = {
    id: 1,
    name: 'Test Artisan',
    identification: '12345678',
    active: true,
  };

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 25000,
    artisanId: 1,
    eventId: 1,
  };

  const mockSale = {
    id: 1,
    eventId: 1,
    productId: 1,
    artisanId: 1,
    quantitySold: 2,
    valueCharged: 50000,
    paymentMethod: 'CASH' as const,
    cardFee: 0,
    state: 'ACTIVE' as const,
    date: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SaleService>(SaleService);
    prisma = module.get<PrismaService>(PrismaService);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createSaleDto: CreateSaleDto = {
      eventId: 1,
      productId: 1,
      artisanId: 1,
      quantitySold: 2,
      valueCharged: 50000,
      paymentMethod: 'CASH',
    };

    it('should create a sale successfully', async () => {
      // Setup mocks
      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.artisan.findUnique.mockResolvedValue(mockArtisan);
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.inventoryMovement.findMany.mockResolvedValue([
        { type: 'ENTRADA', quantity: 10 },
        { type: 'SALIDA', quantity: 3 },
      ]);
      
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          sale: { create: jest.fn().mockResolvedValue(mockSale) },
          inventoryMovement: { create: jest.fn() },
        };
        return callback(mockTx);
      });

      const result = await service.create(createSaleDto);

      expect(result).toEqual(expect.objectContaining({
        id: mockSale.id,
        eventId: mockSale.eventId,
        productId: mockSale.productId,
        artisanId: mockSale.artisanId,
        quantitySold: mockSale.quantitySold,
        valueCharged: mockSale.valueCharged,
        paymentMethod: mockSale.paymentMethod,
        state: mockSale.state,
      }));
    });

    it('should throw BadRequestException if event does not exist', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(service.create(createSaleDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if artisan does not exist', async () => {
      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.artisan.findUnique.mockResolvedValue(null);

      await expect(service.create(createSaleDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if product does not exist', async () => {
      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.artisan.findUnique.mockResolvedValue(mockArtisan);
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.create(createSaleDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if product does not belong to artisan', async () => {
      const invalidProduct = { ...mockProduct, artisanId: 999 };
      
      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.artisan.findUnique.mockResolvedValue(mockArtisan);
      prisma.product.findUnique.mockResolvedValue(invalidProduct);

      await expect(service.create(createSaleDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.artisan.findUnique.mockResolvedValue(mockArtisan);
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.inventoryMovement.findMany.mockResolvedValue([
        { type: 'ENTRADA', quantity: 1 },
        { type: 'SALIDA', quantity: 0 },
      ]);

      await expect(service.create(createSaleDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createMultiSale', () => {
    const createMultiSaleDto: CreateMultiSaleDto = {
      eventId: 1,
      paymentMethod: 'CARD',
      cardFeeTotal: 3000,
      items: [
        { productId: 1, artisanId: 1, quantitySold: 2 },
        { productId: 2, artisanId: 2, quantitySold: 1 },
      ],
    };

    it('should create multiple sales successfully', async () => {
      const mockProducts = [
        { ...mockProduct, id: 1, artisanId: 1, price: 25000 },
        { ...mockProduct, id: 2, artisanId: 2, price: 30000 },
      ];
      const mockArtisans = [
        { ...mockArtisan, id: 1 },
        { ...mockArtisan, id: 2 },
      ];

      // Setup mocks
      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.artisan.findMany.mockResolvedValue(mockArtisans);

      // Mock service.create calls
      jest.spyOn(service, 'create')
        .mockResolvedValueOnce({ ...mockSale, id: 1, valueCharged: 50000 } as any)
        .mockResolvedValueOnce({ ...mockSale, id: 2, valueCharged: 30000 } as any);

      const result = await service.createMultiSale(createMultiSaleDto);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        sale: expect.objectContaining({ id: 1 }),
        totalAmount: 50000,
      }));
    });

    it('should throw BadRequestException if event does not exist', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(service.createMultiSale(createMultiSaleDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all sales without filters', async () => {
      prisma.sale.findMany.mockResolvedValue([mockSale]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: mockSale.id,
        eventId: mockSale.eventId,
      }));
    });

    it('should return filtered sales by eventId', async () => {
      prisma.sale.findMany.mockResolvedValue([mockSale]);

      const result = await service.findAll({ eventId: 1 });

      expect(prisma.sale.findMany).toHaveBeenCalledWith({
        where: { eventId: 1 },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should return sales ordered by date', async () => {
      prisma.sale.findMany.mockResolvedValue([mockSale]);

      const result = await service.findAll({ order: 'date' });

      expect(prisma.sale.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a sale by id', async () => {
      prisma.sale.findUnique.mockResolvedValue(mockSale);

      const result = await service.findOne(1);

      expect(result).toEqual(expect.objectContaining({
        id: mockSale.id,
        eventId: mockSale.eventId,
      }));
    });

    it('should throw NotFoundException if sale does not exist', async () => {
      prisma.sale.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneWithDetails', () => {
    it('should return a sale with detailed relations', async () => {
      const saleWithDetails = {
        ...mockSale,
        product: mockProduct,
        artisan: mockArtisan,
        event: mockEvent,
      };
      
      prisma.sale.findUnique.mockResolvedValue(saleWithDetails);

      const result = await service.findOneWithDetails(1);

      expect(result).toEqual(expect.objectContaining({
        id: mockSale.id,
        product: expect.objectContaining({ name: mockProduct.name }),
        artisan: expect.objectContaining({ name: mockArtisan.name }),
        event: expect.objectContaining({ name: mockEvent.name }),
      }));
    });
  });

  describe('update', () => {
    const updateSaleDto: UpdateSaleDto = {
      quantitySold: 3,
      valueCharged: 75000,
    };

    it('should update a sale successfully', async () => {
      const updatedSale = { ...mockSale, ...updateSaleDto };
      
      prisma.sale.findUnique.mockResolvedValue(mockSale);
      prisma.sale.update.mockResolvedValue(updatedSale);

      const result = await service.update(1, updateSaleDto);

      expect(result).toEqual(expect.objectContaining({
        quantitySold: 3,
        valueCharged: 75000,
      }));
    });

    it('should throw NotFoundException if sale does not exist', async () => {
      prisma.sale.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateSaleDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelSale', () => {
    it('should cancel a sale successfully', async () => {
      const saleWithEvent = { ...mockSale, event: mockEvent };
      const cancelledSale = { ...mockSale, state: 'CANCELLED' };
      
      prisma.sale.findUnique
        .mockResolvedValueOnce(mockSale) // for validation
        .mockResolvedValueOnce(saleWithEvent); // for event status check
      
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          sale: { update: jest.fn().mockResolvedValue(cancelledSale) },
          inventoryMovement: { create: jest.fn() },
        };
        return callback(mockTx);
      });

      const result = await service.cancelSale(1);

      expect(result).toEqual(expect.objectContaining({
        state: 'CANCELLED',
      }));
    });

    it('should throw NotFoundException if sale does not exist', async () => {
      prisma.sale.findUnique.mockResolvedValue(null);

      await expect(service.cancelSale(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a cancelled sale successfully', async () => {
      const cancelledSale = { ...mockSale, state: 'CANCELLED' };
      
      prisma.sale.findUnique.mockResolvedValue(cancelledSale);
      prisma.sale.delete.mockResolvedValue(cancelledSale);

      const result = await service.remove(1);

      expect(result).toEqual(expect.objectContaining({
        id: 1,
        state: 'CANCELLED',
      }));
    });

    it('should throw NotFoundException if sale does not exist', async () => {
      prisma.sale.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if sale is not cancelled', async () => {
      prisma.sale.findUnique.mockResolvedValue(mockSale);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });
});
