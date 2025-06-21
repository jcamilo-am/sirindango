import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleInput } from './types/create-sale.type';
import { CreateMultiSaleDto } from './dto/create-multi-sale.dto';
import { FindAllOptions, MultiSaleResult } from './types/sale.type';
import { getEventStatus } from '../events/utils/event-status.util';


@Injectable()
export class SaleService {
  constructor(private prisma: PrismaService) {}

  async createMultiSale(data: CreateMultiSaleDto): Promise<MultiSaleResult[]> {
    const { eventId, paymentMethod, cardFeeTotal = 0, items } = data;

    // Validación: items no vacío
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Debes enviar al menos un producto para la venta.');
    }

    // Validación: cantidades y valores positivos
    for (const item of items) {
      if (item.quantitySold <= 0) throw new BadRequestException('La cantidad debe ser mayor a cero.');
    }

    // Validación: fee no negativo
    if (cardFeeTotal < 0) throw new BadRequestException('El fee total no puede ser negativo.');

    // Obtén los productos con sus precios
    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } },
      select: { id: true, eventId: true, artisanId: true, price: true }
    });

    // Validación: todos los productos deben ser del mismo evento
    if (products.length !== items.length) throw new BadRequestException('Uno o más productos no existen.');
    if (products.some(p => p.eventId !== eventId)) throw new BadRequestException('Todos los productos deben pertenecer al mismo evento.');

    // Validación: artesanos existen
    const artisanIds = [...new Set(items.map(i => i.artisanId))];
    const artisans = await this.prisma.artisan.findMany({ where: { id: { in: artisanIds } } });
    if (artisans.length !== artisanIds.length) throw new BadRequestException('Uno o más artesanos no existen.');

    // Calcula el valor cobrado por cada item
    const itemsWithValue = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new BadRequestException('Producto no encontrado');
      return {
        ...item,
        valueCharged: product.price * item.quantitySold,
      };
    });

    // Prorratea el fee si es tarjeta
    const total = itemsWithValue.reduce((sum, item) => sum + item.valueCharged, 0);
    const feePorItem = paymentMethod === 'CARD'
      ? itemsWithValue.map(item => ({
          ...item,
          cardFee: total > 0 ? cardFeeTotal * (item.valueCharged / total) : 0
        }))
      : itemsWithValue.map(item => ({ ...item, cardFee: 0 }));

    // Crea cada venta individualmente
    const results: MultiSaleResult[] = [];
    for (const item of feePorItem) {
      const venta = await this.create({
        eventId,
        productId: item.productId,
        artisanId: item.artisanId,
        quantitySold: item.quantitySold,
        valueCharged: item.valueCharged, // Ahora calculado
        paymentMethod,
        cardFee: item.cardFee,
      });
      results.push({ sale: venta, totalAmount: venta.totalAmount });
    }
    return results;
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
      totalAmount: sale.product ? sale.product.price * sale.quantitySold : sale.valueCharged,
      product: undefined,
    };
  }

  // Obtiene el stock actual de un producto sumando movimientos
  private async getCurrentStock(productId: number): Promise<number> {
    const movimientos = await this.prisma.inventoryMovement.findMany({
      where: { productId },
      select: { type: true, quantity: true }
    });

    let stock = 0;
    for (const mov of movimientos) {
      if (mov.type === 'ENTRADA') stock += mov.quantity;
      if (mov.type === 'SALIDA') stock -= mov.quantity;
    }
    return stock;
  }

  // Crea una venta, registra movimiento de inventario y valida reglas de negocio
  private async create(data: CreateSaleInput) {
    // 1. Validar existencia de producto, evento y artesano
    const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new NotFoundException('El producto no existe');
    const event = await this.prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new NotFoundException('El evento no existe');

    // Usa el estado calculado
    const status = getEventStatus(event);
    if (status !== 'ACTIVE') throw new BadRequestException('Solo puedes registrar ventas cuando el evento está en curso.');

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
          valueCharged: data.valueCharged, // <-- agrega esto
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

  async cancelSale(id: number) {
    // 1. Busca la venta
    const sale = await this.prisma.sale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('La venta no existe');
    if (sale.state !== 'ACTIVE') throw new BadRequestException('Solo puedes anular ventas activas');
    
    // 2. No permitir anular ventas de eventos cerrados o no activos
    const event = await this.prisma.event.findUnique({ where: { id: sale.eventId } });
    if (!event) throw new NotFoundException('El evento no existe');
    const status = getEventStatus(event);
    if (status !== 'ACTIVE') throw new BadRequestException('No puedes anular ventas de eventos no activos');

    // 3. Cambia el estado a CANCELLED y regresa el stock
    return await this.prisma.$transaction(async (tx) => {
      // Actualiza el estado
      const cancelledSale = await tx.sale.update({
        where: { id },
        data: { state: 'CANCELLED' },
      });

      // Regresa el stock (movimiento ENTRADA)
      await tx.inventoryMovement.create({
        data: {
          type: 'ENTRADA',
          quantity: sale.quantitySold,
          reason: 'Anulación de venta',
          productId: sale.productId,
          saleId: sale.id,
        },
      });

      return { message: 'Venta anulada', sale: cancelledSale };
    });
  }
}