import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from '../products/types/create-product.type';
import { UpdateProductInput } from '../products/types/update-product.type';
import { FindAllOptions } from '../products/types/filters.type';
import { CreateInventoryMovementInput } from './types/create-inventory-movement.type';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // Crea un producto, el filtro global maneja errores de unicidad
  async create(data: CreateProductInput) {
    try {
      return await this.prisma.product.create({ data });
    } catch (error) {
      throw error;
    }
  }

  // Busca productos con filtros opcionales
  async findAll(options: FindAllOptions = {}) {
    const { eventId, artisanId, order } = options;
    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (artisanId) where.artisanId = artisanId;
    let orderBy: any = undefined;
    if (order === 'name') orderBy = { name: 'asc' };
    if (order === 'quantity') orderBy = { availableQuantity: 'asc' };
    return await this.prisma.product.findMany({ where, orderBy });
  }

  // Busca un producto por ID, lanza NotFoundException si no existe
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('El producto no existe');
    return product;
  }

  // Actualiza un producto si no tiene ventas asociadas
  async update(id: number, data: UpdateProductInput) {
    // Verifica si el producto tiene ventas asociadas
    const salesCount = await this.prisma.sale.count({ where: { productId: id } });
    if (salesCount > 0) {
      throw new BadRequestException('No se puede actualizar un producto con ventas asociadas.');
    }
    try {
      return await this.prisma.product.update({ where: { id }, data });
    } catch (error) {
      // Si no existe, el filtro global lo maneja (P2025)
      throw error;
    }
  }

  // Elimina un producto si no tiene ventas asociadas
  async remove(id: number) {
    // Verifica si el producto tiene ventas asociadas
    const salesCount = await this.prisma.sale.count({ where: { productId: id } });
    if (salesCount > 0) {
      throw new BadRequestException('No se puede eliminar un producto con ventas asociadas.');
    }
    try {
      return await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      // Si no existe, el filtro global lo maneja (P2025)
      throw error;
    }
  }
}

@Injectable()
export class InventoryMovementService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInventoryMovementInput) {
    // 1. Valida que el producto exista y esté activo
    const product = await this.prisma.product.findUnique({ where: { id: data.productId }, include: { event: true } });
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

  async findOne(id: number) {
    const movement = await this.prisma.inventoryMovement.findUnique({ where: { id } });
    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    return movement;
  }

  // Utilidad para stock actual
  private async getCurrentStock(productId: number): Promise<number> {
    const { _sum } = await this.prisma.inventoryMovement.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });
    return _sum.quantity ?? 0;
  }
}