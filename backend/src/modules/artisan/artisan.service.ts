import { Injectable, BadRequestException } from '@nestjs/common';
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
    // Verificar si tiene productos asociados
    const productsCount = await this.prisma.product.count({ where: { artisanId: id } });
    if (productsCount > 0) {
      throw new BadRequestException('Cannot delete artisan with associated products.');
    }

    // Verificar si tiene ventas asociadas
    const salesCount = await this.prisma.sale.count({ where: { artisanId: id } });
    if (salesCount > 0) {
      throw new BadRequestException('Cannot delete artisan with associated sales.');
    }

    // Si no tiene dependencias, eliminar
    return this.prisma.artisan.delete({ where: { id } });
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