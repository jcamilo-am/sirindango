import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryMovementInput } from './types/create-inventory-movement.type';

// Tipos para filtros de movimientos de inventario
interface InventoryMovementFilters {
  productId?: number;
  type?: 'ENTRADA' | 'SALIDA';
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class InventoryMovementService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInventoryMovementInput) {
    // 1. Valida que el producto exista y esté activo
    const product = await this.prisma.product.findUnique({ 
      where: { id: data.productId }, 
      include: { event: true } 
    });
    if (!product) throw new NotFoundException('El producto no existe');

    // 2. No permitir movimientos para productos de eventos cerrados
    if (product.event && product.event.state === 'CLOSED') {
      throw new BadRequestException('No se pueden registrar movimientos para productos de eventos cerrados');
    }

    // 3. Si es SALIDA, valida stock suficiente
    if (data.type === 'SALIDA') {
      const stock = await this.getCurrentStock(data.productId);
      if (stock < data.quantity) {
        throw new BadRequestException('No hay suficiente stock para realizar la salida');
      }
    }

    // 4. Si tiene saleId, valida que la venta exista
    if (data.saleId) {
      const sale = await this.prisma.sale.findUnique({ where: { id: data.saleId } });
      if (!sale) throw new NotFoundException('La venta asociada no existe');
    }

    // 5. Si tiene changeId, valida que el cambio exista
    if (data.changeId) {
      const change = await this.prisma.productChange.findUnique({ where: { id: data.changeId } });
      if (!change) throw new NotFoundException('El cambio asociado no existe');
    }

    // 6. (Opcional) Evita duplicidad de movimientos para la misma venta/cambio
    if (data.saleId) {
      const exists = await this.prisma.inventoryMovement.findFirst({
        where: { saleId: data.saleId, productId: data.productId, type: data.type }
      });
      if (exists) throw new BadRequestException('Ya existe un movimiento para esta venta y producto');
    }
    if (data.changeId) {
      const exists = await this.prisma.inventoryMovement.findFirst({
        where: { changeId: data.changeId, productId: data.productId, type: data.type }
      });
      if (exists) throw new BadRequestException('Ya existe un movimiento para este cambio y producto');
    }

    // 7. Crea el movimiento
    return await this.prisma.inventoryMovement.create({ data });
  }

  async findAll(filters: InventoryMovementFilters = {}) {
    const { productId, type, startDate, endDate } = filters;
    const where: any = {};
    
    if (productId) where.productId = productId;
    if (type) where.type = type;
    
    // Filtros de fecha
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return await this.prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true }
        },
        sale: {
          select: { id: true, valueCharged: true }
        },
        change: {
          select: { id: true, valueDifference: true }
        }
      }
    });
  }

  async findOne(id: number) {
    const movement = await this.prisma.inventoryMovement.findUnique({ 
      where: { id },
      include: {
        product: {
          select: { id: true, name: true }
        },
        sale: {
          select: { id: true, valueCharged: true }
        },
        change: {
          select: { id: true, valueDifference: true }
        }
      }
    });
    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    return movement;
  }

  // Utilidad para stock actual
  private async getCurrentStock(productId: number): Promise<number> {
    const entradas = await this.prisma.inventoryMovement.aggregate({
      where: { productId, type: 'ENTRADA' },
      _sum: { quantity: true },
    });
    const salidas = await this.prisma.inventoryMovement.aggregate({
      where: { productId, type: 'SALIDA' },
      _sum: { quantity: true },
    });
    return (entradas._sum.quantity ?? 0) - (salidas._sum.quantity ?? 0);
  }
}