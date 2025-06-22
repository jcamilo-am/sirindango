import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventService } from '../../src/modules/events/events.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { IntegrationTestSetup, TestDataFactory } from './test-setup';

/**
 * Pruebas de Integración para EventService
 * Solo flujos de negocio críticos con BD real
 */
describe('EventService - Integration', () => {
  let service: EventService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await IntegrationTestSetup.setupTestModule([EventService]);
    service = module.get<EventService>(EventService);
    prisma = IntegrationTestSetup.prisma;
  });

  beforeEach(async () => {
    await IntegrationTestSetup.cleanDatabase();
  });

  describe('Event Business Flows', () => {
    it('should create event and get summary with sales data', async () => {
      // 1. Create event
      const eventData = {
        name: 'Evento Test',
        startDate: new Date('2024-12-15'),
        endDate: new Date('2024-12-16'),
        location: 'Test Location',
        commissionAssociation: 10,
        commissionSeller: 5,
        description: 'Test Description',
      };
      const event = await service.create(eventData); // 2. Create artisan and product
      const artisan = await prisma.artisan.create({
        data: TestDataFactory.createArtisanData({
          name: 'Test Artisan',
          identification: '123456789',
        }),
      });

      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          price: 100,
          eventId: event.id,
          artisanId: artisan.id,
          category: 'Test Category',
        },
      });

      // 3. Create initial inventory movement
      await prisma.inventoryMovement.create({
        data: {
          type: 'ENTRADA',
          quantity: 10,
          reason: 'Carga inicial',
          productId: product.id,
        },
      });

      // 4. Create sale
      await prisma.sale.create({
        data: {
          eventId: event.id,
          productId: product.id,
          artisanId: artisan.id,
          quantitySold: 3,
          valueCharged: 300,
          paymentMethod: 'CASH',
          date: new Date(),
        },
      });

      // 5. Get event summary
      const summary = await service.getEventSummary(event.id);

      expect(summary).toMatchObject({
        eventId: event.id,
        eventName: event.name,
        totalSales: 300,
        paymentTotals: { CASH: 300, CARD: 0 },
        associationCommission: 30, // 10% of 300
        sellerCommission: 15, // 5% of 300
        netForArtisans: 255, // 300 - 30 - 15
      });
      expect(summary.mostSoldProduct).toMatchObject({
        productId: product.id,
        name: product.name,
        quantitySold: 3,
      });
      expect(summary.topArtisan).toMatchObject({
        artisanId: artisan.id,
        name: artisan.name,
        totalSold: 300,
      });
    });

    it('should handle event with no sales correctly', async () => {
      const eventData = {
        name: 'Empty Event',
        startDate: new Date('2024-12-15'),
        endDate: new Date('2024-12-16'),
        location: 'Test Location',
        commissionAssociation: 10,
        commissionSeller: 5,
        description: 'Test Description',
      };
      const event = await service.create(eventData);

      const summary = await service.getEventSummary(event.id);

      expect(summary).toMatchObject({
        eventId: event.id,
        totalSales: 0,
        paymentTotals: { CASH: 0, CARD: 0 },
        associationCommission: 0,
        sellerCommission: 0,
        netForArtisans: 0,
        mostSoldProduct: null,
        topArtisan: null,
        cardFeesTotal: 0,
      });
    });

    it('should update event and maintain data integrity', async () => {
      const eventData = {
        name: 'Original Event',
        startDate: new Date('2024-12-15'),
        endDate: new Date('2024-12-16'),
        location: 'Original Location',
        commissionAssociation: 10,
        commissionSeller: 5,
        description: 'Original Description',
      };
      const event = await service.create(eventData);

      const updateData = {
        name: 'Updated Event',
        commissionAssociation: 15,
        commissionSeller: 8,
      };
      const updatedEvent = await service.update(event.id, updateData);

      expect(updatedEvent).toMatchObject({
        id: event.id,
        name: 'Updated Event',
        commissionAssociation: 15,
        commissionSeller: 8,
        location: 'Original Location', // unchanged
      });

      // Verify the event can still be found
      const foundEvent = await service.findOne(event.id);
      expect(foundEvent.name).toBe('Updated Event');
    });
  });
});
