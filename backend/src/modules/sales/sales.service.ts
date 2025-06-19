import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleInput } from './types/create-sale.type';

type FindAllOptions = {
  eventId?: number;
  artisanId?: number;
  order?: 'date' | 'quantity';
};

@Injectable()
export class SaleService {
  constructor(private prisma: PrismaService) {}

  // Crea una venta, registra movimiento de inventario y valida reglas de negocio
  async create(data: CreateSaleInput) {
    // 1. Validar existencia de producto, evento y artesano
    const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new NotFoundException('El producto no existe');
    const event = await this.prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new NotFoundException('El evento no existe');
    if (event.state !== 'ACTIVE') throw new BadRequestException('El evento no está activo');
    const artisan = await this.prisma.artisan.findUnique({ where: { id: data.artisanId } });
    if (!artisan) throw new NotFoundException('El artesano no existe');

    // 2. Validar stock suficiente (usando movimientos)
    const stock = await this.getCurrentStock(product.id);
    if (stock < data.quantitySold) {
      throw new BadRequestException('No hay suficiente stock disponible');
    }

    // 3. Transacción: crear venta y movimiento de inventario
    return await this.prisma.$transaction(async (tx) => {
      // Crear la venta
      const sale = await tx.sale.create({
        data: {
          ...data,
          cardFee: data.paymentMethod === 'CARD' ? data.cardFee ?? 0 : null,
          date: new Date(),
        },
        include: {
          product: true,
        },
      });

      // Crear movimiento de inventario tipo SALIDA
      await tx.inventoryMovement.create({
        data: {
          type: 'SALIDA',
          quantity: data.quantitySold,
          reason: 'Venta directa',
          productId: data.productId,
          saleId: sale.id,
        },
      });

      // Ya NO actualices el stock en Product, solo con movimientos

      // Retornar la venta con totalAmount calculado
      return {
        ...sale,
        totalAmount: sale.product.price * sale.quantitySold,
      };
    });
  }

  // Busca ventas con filtros opcionales
  async findAll(options: FindAllOptions = {}) {
    const { eventId, artisanId, order } = options;
    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (artisanId) where.artisanId = artisanId;
    let orderBy: any = undefined;
    if (order === 'date') orderBy = { date: 'asc' };
    if (order === 'quantity') orderBy = { quantitySold: 'asc' };
    
    const sales = await this.prisma.sale.findMany({
      where,
      orderBy,
      include: {
        product: true, // Incluir el producto para calcular totalAmount
      },
    });

    // Retornar las ventas con totalAmount calculado
    return sales.map(sale => ({
      ...sale,
      totalAmount: sale.product.price * sale.quantitySold,
      product: undefined,
    }));
  }

  // Busca una venta por ID
  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({ 
      where: { id },
      include: {
        product: true,
      },
    });
    if (!sale) throw new NotFoundException('La venta no existe');
    
    // Retornar la venta con totalAmount calculado
    return {
      ...sale,
      totalAmount: sale.product.price * sale.quantitySold,
      product: undefined,
    };
  }

  // Obtiene el stock actual de un producto sumando movimientos
  private async getCurrentStock(productId: number): Promise<number> {
    const { _sum } = await this.prisma.inventoryMovement.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });
    return _sum.quantity ?? 0;
  }
}