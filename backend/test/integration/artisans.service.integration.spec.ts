import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ArtisanService } from '../../src/modules/artisans/artisans.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { IntegrationTestSetup, TestDataFactory } from './test-setup';

/**
 * Pruebas de Integración para ArtisanService
 *
 * Estas pruebas validan la integración real con PostgreSQL:
 * - Constraints de BD (unique, foreign keys)
 * - Transacciones reales
 * - Cálculos complejos con datos persistidos
 * - Relaciones entre entidades
 */
describe('ArtisanService - Integration', () => {
  let service: ArtisanService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await IntegrationTestSetup.setupTestModule([ArtisanService]);
    service = module.get<ArtisanService>(ArtisanService);
    prisma = IntegrationTestSetup.prisma;
  });

  beforeEach(async () => {
    await IntegrationTestSetup.cleanDatabase();
  });

  describe('create - Database Integration', () => {
    it('should create artisan and persist in database', async () => {
      const artisanData = TestDataFactory.createArtisanData({
        name: 'Juan Pérez Integration',
        identification: '12345678',
      });

      const result = await service.create(artisanData);

      // Verificar que se creó en BD
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Juan Pérez Integration');
      // Verificar persistencia real
      const persisted = await prisma.artisan.findUnique({
        where: { id: result.id },
      });
      expect(persisted).toBeTruthy();
      expect(persisted!.identification).toBe('12345678');
    });

    it('should enforce unique identification constraint in database', async () => {
      const artisanData = TestDataFactory.createArtisanData({
        identification: '11111111',
      });

      // Crear el primero
      await service.create(artisanData);

      // Intentar crear segundo con misma identificación
      await expect(
        service.create({
          ...artisanData,
          name: 'Otro Artesano',
        }),
      ).rejects.toThrow(BadRequestException);

      // Verificar que solo existe uno en BD
      const count = await prisma.artisan.count({
        where: { identification: '11111111' },
      });
      expect(count).toBe(1);
    });
  });

  describe('update - Database Integration', () => {
    it('should enforce unique identification constraint when updating', async () => {
      // Crear dos artesanos
      const artisan1 = await service.create(
        TestDataFactory.createArtisanData({
          name: 'Artesano 1',
          identification: '11111111',
        }),
      );

      const artisan2 = await service.create(
        TestDataFactory.createArtisanData({
          name: 'Artesano 2',
          identification: '22222222',
        }),
      );

      // Intentar actualizar artisan2 con identificación de artisan1
      await expect(
        service.update(artisan2.id, {
          identification: '11111111',
        }),
      ).rejects.toThrow(BadRequestException); // Verificar que artisan2 no cambió
      const unchanged = await prisma.artisan.findUnique({
        where: { id: artisan2.id },
      });
      expect(unchanged).toBeTruthy();
      expect(unchanged!.identification).toBe('22222222');
    });

    it('should enforce business rules with real sales data', async () => {
      // Crear artesano
      const artisan = await service.create(TestDataFactory.createArtisanData());

      // Crear evento
      const event = await prisma.event.create({
        data: TestDataFactory.createEventData(),
      });

      // Crear producto
      const product = await prisma.product.create({
        data: TestDataFactory.createProductData(artisan.id, event.id),
      });

      // Crear venta real
      await prisma.sale.create({
        data: TestDataFactory.createSaleData(artisan.id, product.id, event.id),
      });

      // Intentar cambiar nombre (debe fallar porque tiene ventas)
      await expect(
        service.update(artisan.id, {
          name: 'Nuevo Nombre',
        }),
      ).rejects.toThrow(BadRequestException);

      // Pero permitir cambiar solo 'active'
      const updated = await service.update(artisan.id, { active: false });
      expect(updated.active).toBe(false);
    });
  });

  describe('remove - Database Integration', () => {
    it('should prevent deletion when real foreign key dependencies exist', async () => {
      // Crear artesano
      const artisan = await service.create(TestDataFactory.createArtisanData());

      // Crear evento
      const event = await prisma.event.create({
        data: TestDataFactory.createEventData(),
      });

      // Crear producto (dependencia real)
      await prisma.product.create({
        data: TestDataFactory.createProductData(artisan.id, event.id),
      });

      // Intentar eliminar artesano con producto
      await expect(service.remove(artisan.id)).rejects.toThrow(
        BadRequestException,
      );

      // Verificar que artesano sigue existiendo
      const stillExists = await prisma.artisan.findUnique({
        where: { id: artisan.id },
      });
      expect(stillExists).toBeTruthy();
    });

    it('should prevent deletion when inventory movements exist', async () => {
      // Crear estructura completa
      const artisan = await service.create(TestDataFactory.createArtisanData());
      const event = await prisma.event.create({
        data: TestDataFactory.createEventData(),
      });
      const product = await prisma.product.create({
        data: TestDataFactory.createProductData(artisan.id, event.id),
      }); // Crear movimiento de inventario
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'ENTRADA',
          quantity: 10,
          reason: 'Entrada inicial',
        },
      });

      // Intentar eliminar artesano
      await expect(service.remove(artisan.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow deletion when no dependencies exist', async () => {
      const artisan = await service.create(TestDataFactory.createArtisanData());

      const result = await service.remove(artisan.id);
      expect(result.id).toBe(artisan.id);

      // Verificar eliminación real
      const deleted = await prisma.artisan.findUnique({
        where: { id: artisan.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('getSummaryByEvent - Database Integration', () => {
    it('should calculate summary with real persisted data', async () => {
      // Crear estructura completa con datos reales
      const artisan = await service.create(
        TestDataFactory.createArtisanData({
          name: 'Artesano Summary Test',
        }),
      );

      const event = await prisma.event.create({
        data: TestDataFactory.createEventData({
          commissionAssociation: 5.0,
          commissionSeller: 10.0,
        }),
      });

      const product = await prisma.product.create({
        data: TestDataFactory.createProductData(artisan.id, event.id, {
          name: 'Producto Premium',
          price: 150,
        }),
      }); // Crear movimientos de inventario
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'ENTRADA',
          quantity: 20,
          reason: 'Stock inicial',
        },
      });

      // Crear ventas reales
      await prisma.sale.createMany({
        data: [
          TestDataFactory.createSaleData(artisan.id, product.id, event.id, {
            quantitySold: 3,
            valueCharged: 450,
          }),
          TestDataFactory.createSaleData(artisan.id, product.id, event.id, {
            quantitySold: 2,
            valueCharged: 300,
          }),
        ],
      });

      // Obtener resumen con cálculos reales
      const summary = await service.getSummaryByEvent(artisan.id, event.id);

      expect(summary.artisanId).toBe(artisan.id);
      expect(summary.artisanName).toBe('Artesano Summary Test');
      expect(summary.totalSold).toBe(750); // 450 + 300
      expect(summary.commissionAssociation).toBe(37.5); // 5% de 750
      expect(summary.commissionSeller).toBe(75); // 10% de 750
      expect(summary.soldProducts).toHaveLength(1);
      expect(summary.soldProducts[0].quantitySold).toBe(5); // 3 + 2
    });

    it('should handle non-existent event with real database check', async () => {
      const artisan = await service.create(TestDataFactory.createArtisanData());

      await expect(
        service.getSummaryByEvent(artisan.id, 99999),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Complex Business Scenarios', () => {
    it('should handle artisan deactivation rules with real dependencies', async () => {
      // Escenario complejo: artesano con productos pero sin ventas activas
      const artisan = await service.create(TestDataFactory.createArtisanData());
      const event = await prisma.event.create({
        data: TestDataFactory.createEventData(),
      });

      // Crear producto
      const product = await prisma.product.create({
        data: TestDataFactory.createProductData(artisan.id, event.id),
      });

      // Crear venta cancelada (no activa)
      await prisma.sale.create({
        data: TestDataFactory.createSaleData(artisan.id, product.id, event.id, {
          state: 'CANCELLED',
        }),
      });

      // No debe permitir desactivar porque tiene productos
      await expect(
        service.update(artisan.id, { active: false }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
