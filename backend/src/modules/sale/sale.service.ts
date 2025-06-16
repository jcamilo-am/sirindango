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

  // Crea una venta, valida existencia y stock, el filtro global maneja errores de unicidad
  async create(data: CreateSaleInput) {
    // Valida existencia de producto, evento y artesano
    const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new NotFoundException('El producto no existe');
    const event = await this.prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new NotFoundException('El evento no existe');
    const artisan = await this.prisma.artisan.findUnique({ where: { id: data.artisanId } });
    if (!artisan) throw new NotFoundException('El artesano no existe');

    // Valida stock suficiente
    if (product.availableQuantity < data.quantitySold) {
      throw new BadRequestException('No hay suficiente stock disponible');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Registra la venta
      const sale = await tx.sale.create({
        data: {
          ...data,
          date: new Date(),
        },
      });

      // Actualiza la cantidad disponible del producto
      await tx.product.update({
        where: { id: data.productId },
        data: {
          availableQuantity: {
            decrement: data.quantitySold,
          },
        },
      });

      return sale;
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
    return this.prisma.sale.findMany({
      where,
      orderBy,
    });
  }

  // Busca una venta por ID
  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('La venta no existe');
    return sale;
  }
}