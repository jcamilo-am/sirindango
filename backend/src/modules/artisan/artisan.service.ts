/*import { Injectable } from '@nestjs/common';
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

  remove(id: number) {
    return this.prisma.artisan.delete({ where: { id } });
  }
}*/