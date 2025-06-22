import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryMovementDto, InventoryMovementFiltersDto } from './dto/inventory-movement.dto';
import { InventoryMovementResponseEntity, InventoryMovementDetailedResponseEntity } from './entities/inventory-movement-response.entity';
import { InventoryMovementValidationHelper } from './helpers/inventory-movement-validation.helper';
import { CreateInventoryMovementInput, InventoryMovementFilters } from './types/inventory-movement.types';

@Injectable()
export class InventoryMovementService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo movimiento de inventario
   */
  async create(data: CreateInventoryMovementDto): Promise<InventoryMovementResponseEntity> {
    // Usar el helper para validaciones completas
    const validation = await InventoryMovementValidationHelper.validateCompleteMovement(
      this.prisma,
      data
    );

    // Crear el movimiento
    const movement = await this.prisma.inventoryMovement.create({ 
      data: {
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        productId: data.productId,
        saleId: data.saleId,
        changeId: data.changeId,
      }
    });

    return InventoryMovementResponseEntity.fromPrisma(movement);
  }

  /**
   * Obtiene todos los movimientos con filtros opcionales
   */
  async findAll(filters: InventoryMovementFilters): Promise<{
    movements: InventoryMovementDetailedResponseEntity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Validar filtros de fecha
    if (filters.startDate || filters.endDate) {
      InventoryMovementValidationHelper.validateDateRange(filters.startDate, filters.endDate);
    }

    // Validar paginación
    InventoryMovementValidationHelper.validatePagination(filters.page, filters.limit);

    // Construir filtros WHERE
    const where: any = {};
    
    if (filters.productId) where.productId = filters.productId;
    if (filters.type) where.type = filters.type;
    if (filters.saleId) where.saleId = filters.saleId;
    if (filters.changeId) where.changeId = filters.changeId;
    if (filters.eventId) {
      where.product = { eventId: filters.eventId };
    }
    if (filters.artisanId) {
      where.product = { 
        ...(where.product || {}),
        artisanId: filters.artisanId 
      };
    }

    // Filtros de fecha
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    // Calcular offset para paginación
    const offset = (filters.page - 1) * filters.limit;

    // Ejecutar consultas en paralelo
    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        skip: offset,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { 
              id: true, 
              name: true, 
              price: true,
              artisan: { select: { name: true } },
              event: { select: { name: true } }
            },
          },
          sale: {
            select: { 
              id: true, 
              valueCharged: true
            },
          },
          change: {
            select: { 
              id: true, 
              valueDifference: true
            },
          },
        },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    const totalPages = Math.ceil(total / filters.limit);

    return {
      movements: movements.map(movement => 
        InventoryMovementDetailedResponseEntity.fromPrisma(movement)
      ),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Obtiene un movimiento específico por ID
   */
  async findOne(id: number): Promise<InventoryMovementDetailedResponseEntity> {
    const movement = await this.prisma.inventoryMovement.findUnique({
      where: { id },
      include: {
        product: {
          select: { 
            id: true, 
            name: true, 
            price: true,
            artisan: { select: { name: true } },
            event: { select: { name: true } }
          },
        },
        sale: {
          select: { 
            id: true, 
            valueCharged: true
          },
        },
        change: {
          select: { 
            id: true, 
            valueDifference: true
          },
        },
      },
    });

    if (!movement) {
      throw new NotFoundException('Movimiento de inventario no encontrado');
    }

    return InventoryMovementDetailedResponseEntity.fromPrisma(movement);
  }

  /**
   * Obtiene el stock actual de un producto
   */
  async getCurrentStock(productId: number): Promise<number> {
    return InventoryMovementValidationHelper.calculateCurrentStock(this.prisma, productId);
  }

  /**
   * Obtiene estadísticas de movimientos de inventario
   */
  async getStats(filters: {
    eventId?: number;
    artisanId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    // Validar filtros de fecha
    if (filters.startDate || filters.endDate) {
      InventoryMovementValidationHelper.validateDateRange(filters.startDate, filters.endDate);
    }

    const where: any = {};
    
    if (filters.eventId) {
      where.product = { eventId: filters.eventId };
    }
    if (filters.artisanId) {
      where.product = { 
        ...(where.product || {}),
        artisanId: filters.artisanId 
      };
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [
      totalMovements,
      totalEntradas,
      totalSalidas,
      entradasQuantity,
      salidasQuantity
    ] = await Promise.all([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.count({ 
        where: { ...where, type: 'ENTRADA' } 
      }),
      this.prisma.inventoryMovement.count({ 
        where: { ...where, type: 'SALIDA' } 
      }),
      this.prisma.inventoryMovement.aggregate({
        where: { ...where, type: 'ENTRADA' },
        _sum: { quantity: true },
      }),
      this.prisma.inventoryMovement.aggregate({
        where: { ...where, type: 'SALIDA' },
        _sum: { quantity: true },
      }),
    ]);

    return {
      totalMovements,
      totalEntradas,
      totalSalidas,
      totalQuantityEntradas: entradasQuantity._sum.quantity ?? 0,
      totalQuantitySalidas: salidasQuantity._sum.quantity ?? 0,
      netQuantity: (entradasQuantity._sum.quantity ?? 0) - (salidasQuantity._sum.quantity ?? 0),
    };
  }
}
