import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

/**
 * Utilidad para configurar pruebas de integración con base de datos real
 * Usa una BD de pruebas separada para evitar conflictos
 */
export class IntegrationTestSetup {
  static testModule: TestingModule;
  static prisma: PrismaService;

  /**
   * Configura el módulo de pruebas con PrismaService real
   */
  static async setupTestModule(providers: any[] = []) {
    // Asegurar que usamos una BD de pruebas
    if (!process.env.DATABASE_URL?.includes('test')) {
      throw new Error(
        'Las pruebas de integración requieren una DATABASE_URL de pruebas',
      );
    }

    this.testModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test', // Archivo separado para pruebas
        }),
      ],
      providers: [PrismaService, ...providers],
    }).compile();

    this.prisma = this.testModule.get<PrismaService>(PrismaService);

    // Conectar a la BD de pruebas
    await this.prisma.$connect();

    return this.testModule;
  }

  /**
   * Limpia todas las tablas para empezar cada prueba limpio
   */
  static async cleanDatabase() {
    if (!this.prisma) {
      throw new Error(
        'Prisma no está inicializado. Llama setupTestModule() primero.',
      );
    }

    // Orden importante: eliminar en orden de dependencias
    await this.prisma.productChange.deleteMany();
    await this.prisma.sale.deleteMany();
    await this.prisma.inventoryMovement.deleteMany();
    await this.prisma.product.deleteMany();
    await this.prisma.artisan.deleteMany();
    await this.prisma.event.deleteMany();
    await this.prisma.user.deleteMany();
  }

  /**
   * Cierra la conexión después de las pruebas
   */
  static async teardown() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
    if (this.testModule) {
      await this.testModule.close();
    }
  }
}

/**
 * Factory para crear datos de prueba realistas
 */
export class TestDataFactory {
  static createArtisanData(override: Partial<any> = {}) {
    return {
      name: 'Juan Pérez Test',
      identification: '12345678',
      active: true,
      ...override,
    };
  }

  static createEventData(override: Partial<any> = {}) {
    return {
      name: 'Feria Test 2025',
      location: 'Plaza Principal',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-03'),
      commissionAssociation: 5.0,
      commissionSeller: 10.0,
      state: 'ACTIVE' as const,
      ...override,
    };
  }

  static createProductData(
    artisanId: number,
    eventId: number,
    override: Partial<any> = {},
  ) {
    return {
      name: 'Producto Test',
      price: 100,
      artisanId,
      eventId,
      ...override,
    };
  }

  static createSaleData(
    artisanId: number,
    productId: number,
    eventId: number,
    override: Partial<any> = {},
  ) {
    return {
      artisanId,
      productId,
      eventId,
      quantitySold: 2,
      valueCharged: 200,
      paymentMethod: 'CASH' as const,
      date: new Date(),
      state: 'ACTIVE' as const,
      ...override,
    };
  }
}
