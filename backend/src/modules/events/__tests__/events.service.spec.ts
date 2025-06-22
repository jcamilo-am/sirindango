import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventService } from '../events.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';

describe('EventService', () => {
  let service: EventService;

  const mockPrisma = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    sale: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    artisan: {
      findMany: jest.fn(),
    },
    productChange: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an event successfully', async () => {
      const createData: CreateEventDto = {
        name: 'Feria Test',
        location: 'Plaza Principal',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-07-03'),
        commissionAssociation: 5,
        commissionSeller: 10,
      };
      const createdEvent = {
        id: 1,
        ...createData,
        state: 'SCHEDULED' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.event.create.mockResolvedValue(createdEvent);

      const result = await service.create(createData);
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          state: 'SCHEDULED',
        },
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: createdEvent.id,
          name: createdEvent.name,
          location: createdEvent.location,
          startDate: createdEvent.startDate,
          endDate: createdEvent.endDate,
          commissionAssociation: createdEvent.commissionAssociation,
          commissionSeller: createdEvent.commissionSeller,
          status: 'UPCOMING',
          createdAt: createdEvent.createdAt,
          updatedAt: createdEvent.updatedAt,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all events with status', async () => {
      const events = [
        {
          id: 1,
          name: 'Evento 1',
          location: 'Ubicación 1',
          startDate: new Date('2025-07-01'),
          endDate: new Date('2025-07-03'),
          state: 'SCHEDULED',
          commissionAssociation: 5,
          commissionSeller: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.event.findMany.mockResolvedValue(events);

      const result = await service.findAll();

      expect(mockPrisma.event.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('status');
    });
  });

  describe('findOne', () => {
    it('should find event by id', async () => {
      const event = {
        id: 1,
        name: 'Evento Test',
        location: 'Plaza Principal',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-07-03'),
        state: 'SCHEDULED',
        commissionAssociation: 5,
        commissionSeller: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.event.findUnique.mockResolvedValue(event);

      const result = await service.findOne(1);

      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: event.id,
          name: event.name,
          location: event.location,
          startDate: event.startDate,
          endDate: event.endDate,
          commissionAssociation: event.commissionAssociation,
          commissionSeller: event.commissionSeller,
          status: 'UPCOMING',
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        }),
      );
    });

    it('should throw NotFoundException when event not found', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an event successfully', async () => {
      const updateData: UpdateEventDto = {
        name: 'Evento Actualizado',
      };

      const existingEvent = {
        id: 1,
        name: 'Evento Original',
        location: 'Plaza Principal',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-07-03'),
        state: 'SCHEDULED',
        commissionAssociation: 5,
        commissionSeller: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedEvent = {
        ...existingEvent,
        ...updateData,
        updatedAt: new Date(),
      };

      mockPrisma.event.findUnique.mockResolvedValue(existingEvent);
      mockPrisma.event.update.mockResolvedValue(updatedEvent);

      const result = await service.update(1, updateData);

      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: updatedEvent.id,
          name: updatedEvent.name,
          location: updatedEvent.location,
          startDate: updatedEvent.startDate,
          endDate: updatedEvent.endDate,
          commissionAssociation: updatedEvent.commissionAssociation,
          commissionSeller: updatedEvent.commissionSeller,
          status: 'UPCOMING',
          createdAt: updatedEvent.createdAt,
          updatedAt: updatedEvent.updatedAt,
        }),
      );
    });
  });

  describe('closeEvent', () => {
    it('should close an event successfully', async () => {
      const event = {
        id: 1,
        name: 'Evento Test',
        location: 'Plaza Principal',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-07-03'),
        state: 'ACTIVE',
        commissionAssociation: 5,
        commissionSeller: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const closedEvent = {
        ...event,
        state: 'CLOSED',
        updatedAt: new Date(),
      };

      mockPrisma.event.findUnique.mockResolvedValue(event);
      mockPrisma.event.update.mockResolvedValue(closedEvent);

      const result = await service.closeEvent(1);

      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { state: 'CLOSED' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: closedEvent.id,
          name: closedEvent.name,
          location: closedEvent.location,
          startDate: closedEvent.startDate,
          endDate: closedEvent.endDate,
          commissionAssociation: closedEvent.commissionAssociation,
          commissionSeller: closedEvent.commissionSeller,
          status: 'UPCOMING', // Status is calculated based on dates, not the database state
          createdAt: closedEvent.createdAt,
          updatedAt: closedEvent.updatedAt,
        }),
      );
    });
  });
});
