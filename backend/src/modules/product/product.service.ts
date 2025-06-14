/*import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './types/create-product.type';
import { UpdateProductInput } from './types/update-product.type';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateProductInput) {
    return this.prisma.product.create({ data });
  }

  findAll() {
    return this.prisma.product.findMany();
  }

  findOne(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateProductInput) {
    return this.prisma.product.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }
}*/