import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './types/create-product.type';
import { UpdateProductInput } from './types/update-product.type';
import { FindAllOptions } from './types/filters.type';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateProductInput) {
    return this.prisma.product.create({ data });
  }

  findAll(options: FindAllOptions = {}) {
    const { eventId, artisanId, order } = options;

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (artisanId) where.artisanId = artisanId;

    let orderBy: any = undefined;
    if (order === 'name') orderBy = { name: 'asc' };
    if (order === 'quantity') orderBy = { availableQuantity: 'asc' };

    return this.prisma.product.findMany({
      where,
      orderBy,
    });
  }

  findOne(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateProductInput) {
    // Validar que el producto no tenga ventas asociadas
    const salesCount = await this.prisma.sale.count({ where: { productId: id } });
    if (salesCount > 0) {
      throw new BadRequestException('Cannot update product with associated sales.');
    }
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: number) {
    // Validar que el producto no tenga ventas asociadas
    const salesCount = await this.prisma.sale.count({ where: { productId: id } });
    if (salesCount > 0) {
      throw new BadRequestException('Cannot delete product with associated sales.');
    }
    return this.prisma.product.delete({ where: { id } });
  }
}