import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductChangeInput, ListProductChangesQuery } from './types/product-change.types';
import { 
  ProductChangeResponseEntity, 
  ProductChangeCreationResponseEntity,
  ProductChangeDetailedResponseEntity,
  ProductChangeListResponseEntity
} from './entities/product-change-response.entity';
import { ProductChangeValidationHelper } from './helpers/product-change-validation.helper';
import { ProductChangeInventoryHelper } from './helpers/product-change-inventory.helper';

@Injectable()
export class ProductChangeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo cambio de producto
   */
  async create(data: CreateProductChangeInput): Promise<ProductChangeCreationResponseEntity> {
    // Validar todos los aspectos del cambio de producto
    const validation = await ProductChangeValidationHelper.validateCompleteProductChange(
      this.prisma,
      data
    );

    const { sale, calculation } = validation;

    // Realizar la transacción completa
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Crear el registro de cambio
      const productChange = await tx.productChange.create({
        data: {
          saleId: data.saleId,
          productReturnedId: data.productReturnedId,
          productDeliveredId: data.productDeliveredId,
          quantity: data.quantity,
          deliveredProductPrice: calculation.deliveredProductPrice,
          valueDifference: calculation.valueDifference,
          paymentMethodDifference: data.paymentMethodDifference,
          cardFeeDifference: data.cardFeeDifference,
        },
      });      // 2. Crear movimientos de inventario
      const inventoryOperations = await ProductChangeInventoryHelper.createInventoryMovements(
        tx as any,
        productChange.id,
        data.productReturnedId,
        data.productDeliveredId,
        data.quantity
      );

      // 3. Actualizar estado de venta si es necesario
      const saleOperations = await ProductChangeInventoryHelper.updateSaleStateIfNeeded(
        tx as any,
        data.saleId,
        data.quantity,
        sale.quantitySold
      );

      return {
        productChange,
        operations: [...inventoryOperations, ...saleOperations]
      };
    });

    return new ProductChangeCreationResponseEntity({
      productChange: ProductChangeResponseEntity.fromPrisma(result.productChange),
      message: 'Cambio de producto registrado exitosamente',
      operations: result.operations
    });
  }

  /**
   * Obtiene un cambio de producto por ID
   */
  async findOne(id: number): Promise<ProductChangeResponseEntity> {
    const productChange = await this.prisma.productChange.findUnique({
      where: { id },
    });

    if (!productChange) {
      throw new Error('Cambio de producto no encontrado');
    }

    return ProductChangeResponseEntity.fromPrisma(productChange);
  }

  /**
   * Obtiene un cambio de producto con información detallada
   */
  async findOneDetailed(id: number): Promise<ProductChangeDetailedResponseEntity> {
    const productChange = await this.prisma.productChange.findUnique({
      where: { id },
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

    if (!productChange) {
      throw new Error('Cambio de producto no encontrado');
    }

    return ProductChangeDetailedResponseEntity.fromPrismaDetailed(productChange);
  }
  /**
   * Lista cambios de producto con filtros y paginación
   */
  async findMany(query: Partial<ListProductChangesQuery> = {}): Promise<ProductChangeListResponseEntity> {
    const { page = 1, limit = 10, eventId, artisanId, saleId } = query;
    const skip = (page - 1) * limit;

    // Construir filtros dinámicos
    const whereClause: any = {};

    if (saleId) {
      whereClause.saleId = saleId;
    }

    if (eventId || artisanId) {
      whereClause.sale = {};
      if (eventId) {
        whereClause.sale.eventId = eventId;
      }
      if (artisanId) {
        whereClause.sale.artisanId = artisanId;
      }
    }

    // Ejecutar consultas en paralelo
    const [productChanges, total] = await Promise.all([
      this.prisma.productChange.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productChange.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return new ProductChangeListResponseEntity({
      data: productChanges.map(change => ProductChangeResponseEntity.fromPrisma(change)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  }

  /**
   * Obtiene estadísticas de cambios de producto para un evento
   */
  async getEventStats(eventId: number) {
    return await ProductChangeValidationHelper.calculateProductChangeStats(this.prisma, eventId);
  }

  /**
   * Obtiene el historial de movimientos de inventario para un cambio
   */
  async getInventoryMovements(changeId: number) {
    return await ProductChangeInventoryHelper.getMovementsByChange(this.prisma, changeId);
  }

  /**
   * Obtiene cambios de producto por venta
   */
  async findBySale(saleId: number): Promise<ProductChangeResponseEntity[]> {
    const changes = await this.prisma.productChange.findMany({
      where: { saleId },
      orderBy: { createdAt: 'desc' },
    });

    return changes.map(change => ProductChangeResponseEntity.fromPrisma(change));
  }

  /**
   * Verifica si una venta tiene cambios registrados
   */
  async hasProductChanges(saleId: number): Promise<boolean> {
    const count = await this.prisma.productChange.count({
      where: { saleId },
    });

    return count > 0;
  }
}
