import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleInput } from './types/create-sale.type';
import { UpdateSaleInput } from './types/update-sale.type';

type FindAllOptions = {
  eventId?: number;
  artisanId?: number;
  order?: 'date' | 'quantity';
};

@Injectable()
export class SaleService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSaleInput) {
    // Validar existencia de producto, evento y artesano
    const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const event = await this.prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const artisan = await this.prisma.artisan.findUnique({ where: { id: data.artisanId } });
    if (!artisan) throw new NotFoundException('Artisan not found');

    // Validar stock suficiente
    if (product.availableQuantity < data.quantitySold) {
      throw new BadRequestException('Not enough stock available');
    }

    // Registrar la venta con fecha = now()
    const sale = await this.prisma.sale.create({
      data: {
        ...data,
        date: new Date(),
      },
    });

    // Actualizar cantidadDisponible del producto (descontar la venta)
    await this.prisma.product.update({
      where: { id: data.productId },
      data: {
        availableQuantity: product.availableQuantity - data.quantitySold,
      },
    });

    return sale;
  }

  async findAll(options: FindAllOptions = {}) {
    const { eventId, artisanId, order } = options;

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (artisanId) where.artisanId = artisanId;

    let orderBy: any = undefined;
    if (order === 'date') orderBy = { date: 'asc' };
    if (order === 'quantity') orderBy = { quantitySold: 'asc' };

    return this.prisma.sale.findMany({
      where,
      orderBy,
    });
  }

  findOne(id: number) {
    return this.prisma.sale.findUnique({ where: { id } });
  }
}