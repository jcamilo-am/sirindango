import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './types/create-product.type';
import { UpdateProductInput } from './types/update-product.type';

type FindAllOptions = {
  eventId?: number;
  artisanId?: number;
  order?: 'name' | 'quantity';
};

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

  update(id: number, data: UpdateProductInput) {
    throw new Error('Method not implemented.'); // TODO: Implement product update logic
  }

  remove(id: number) {
    throw new Error('Method not implemented.'); // TODO: Implement product deletion logic
  }
}