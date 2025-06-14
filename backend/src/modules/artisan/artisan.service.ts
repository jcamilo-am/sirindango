import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtisanInput } from './types/create-artisan.type';
import { UpdateArtisanInput } from './types/update-artisan.type';

@Injectable()
export class ArtisanService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateArtisanInput) {
    return this.prisma.artisan.create({ data });
  }

  findAll() {
    return this.prisma.artisan.findMany();
  }

  findOne(id: number) {
    return this.prisma.artisan.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateArtisanInput) {
    return this.prisma.artisan.update({ where: { id }, data });
  }

  async remove(id: number) {
    // Placeholder: No implementado porque aún no existen los módulos de productos/ventas
    throw new Error('Delete not allowed: This feature will be available when product and sale modules are implemented.');
  }

  async findByIdByEvent(artisanId: number, eventId: number) {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
      include: {
        products: { where: { eventId } },
        sales: { where: { eventId } },
      },
    });
    return artisan;
  }
}