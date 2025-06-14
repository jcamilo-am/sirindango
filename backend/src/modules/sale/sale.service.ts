/*import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleInput } from './types/create-sale.type';
import { UpdateSaleInput } from './types/update-sale.type';

@Injectable()
export class SaleService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateSaleInput) {
    return this.prisma.sale.create({ data });
  }

  findAll() {
    return this.prisma.sale.findMany();
  }

  findOne(id: number) {
    return this.prisma.sale.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateSaleInput) {
    return this.prisma.sale.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.sale.delete({ where: { id } });
  }
}*/