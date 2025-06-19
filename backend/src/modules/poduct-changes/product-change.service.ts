import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductChangeInput } from './types/create-product-change.type';

@Injectable()
export class ProductChangeService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductChangeInput) {
    // 1. Validar existencia de la venta y productos
    const sale = await this.prisma.sale.findUnique({
      where: { id: data.saleId },
      include: { event: true }
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.state !== 'ACTIVE') throw new BadRequestException('La venta ya fue cambiada');

    // Refuerzo: No permitir cambios en eventos cerrados
    if (sale.event.state === 'CLOSED') {
      throw new BadRequestException('No se puede cambiar una venta de un evento cerrado');
    }

    const productReturned = await this.prisma.product.findUnique({ where: { id: data.productReturnedId } });
    if (!productReturned) throw new NotFoundException('Producto original no encontrado');

    const productDelivered = await this.prisma.product.findUnique({ where: { id: data.productDeliveredId } });
    if (!productDelivered) throw new NotFoundException('Producto nuevo no encontrado');

    // Refuerzo: Ambos productos deben pertenecer al mismo evento y artesano que la venta
    if (
      productReturned.eventId !== sale.eventId ||
      productDelivered.eventId !== sale.eventId ||
      productReturned.artisanId !== sale.artisanId ||
      productDelivered.artisanId !== sale.artisanId
    ) {
      throw new BadRequestException('Los productos deben pertenecer al mismo evento y artesano que la venta');
    }

    // Refuerzo: No permitir cambiar más unidades de las vendidas
    if (data.quantity > sale.quantitySold) {
      throw new BadRequestException('No puedes cambiar más unidades de las que se vendieron');
    }

    // 2. Validar que no se repita el cambio para la misma venta
    const existingChange = await this.prisma.productChange.findFirst({
      where: { saleId: data.saleId }
    });
    if (existingChange) throw new BadRequestException('Ya existe un cambio para esta venta');

    // 3. Validar stock suficiente del producto nuevo
    // Calcula stock sumando movimientos
    const deliveredMovements = await this.prisma.inventoryMovement.aggregate({
      where: { productId: data.productDeliveredId },
      _sum: { quantity: true }
    });
    const deliveredStock = deliveredMovements._sum.quantity ?? 0;
    if (deliveredStock < data.quantity) {
      throw new BadRequestException('No hay suficiente stock del producto nuevo');
    }

    // 4. Transacción: crear cambio y movimientos
    return await this.prisma.$transaction(async (tx) => {
      // Crear el registro de cambio
      const productChange = await tx.productChange.create({
        data: {
          ...data,
          deliveredProductPrice: data.deliveredProductPrice,
          valueDifference: data.valueDifference,
          paymentMethodDifference: data.paymentMethodDifference,
          cardFeeDifference: data.cardFeeDifference,
        },
      });

      // Movimiento ENTRADA: producto original devuelto
      await tx.inventoryMovement.create({
        data: {
          type: 'ENTRADA',
          quantity: data.quantity,
          reason: 'Devolución por cambio',
          productId: data.productReturnedId,
          changeId: productChange.id,
        },
      });

      // Movimiento SALIDA: producto nuevo entregado
      await tx.inventoryMovement.create({
        data: {
          type: 'SALIDA',
          quantity: data.quantity,
          reason: 'Entrega por cambio',
          productId: data.productDeliveredId,
          changeId: productChange.id,
        },
      });

      // Si la cantidad devuelta es igual a la cantidad vendida, marca la venta como CHANGED
      if (data.quantity === sale.quantitySold) {
        await tx.sale.update({
          where: { id: sale.id },
          data: { state: 'CHANGED' },
        });
      }

      return {
        productChange,
        message: 'Cambio registrado y movimientos creados',
      };
    });
  }

  async findOne(id: number) {
    const change = await this.prisma.productChange.findUnique({ where: { id } });
    if (!change) throw new NotFoundException('Cambio no encontrado');
    return change;
  }
}