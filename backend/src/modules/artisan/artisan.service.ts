import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtisanInput } from './types/create-artisan.type';
import { UpdateArtisanInput } from './types/update-artisan.type';

@Injectable()
export class ArtisanService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo artesano.
   * Lanza ConflictException si hay un conflicto de datos únicos.
   */
  async create(data: CreateArtisanInput) {
    try {
      return await this.prisma.artisan.create({ data });
    } catch (error) {
      // Si ocurre un error de restricción única, el filtro global lo manejará,
      // pero aquí puedes lanzar una excepción más específica si lo deseas.
      throw error;
    }
  }

  /**
   * Obtiene todos los artesanos.
   */
  async findAll() {
    return await this.prisma.artisan.findMany();
  }

  /**
   * Busca un artesano por ID.
   * Lanza NotFoundException si no existe.
   */
  async findOne(id: number) {
    const artisan = await this.prisma.artisan.findUnique({ where: { id } });
    if (!artisan) {
      // Lanzar excepción si no se encuentra el artesano
      throw new NotFoundException('El artesano no existe');
    }
    return artisan;
  }

  /**
   * Actualiza un artesano por ID.
   * Lanza NotFoundException si no existe.
   */
  async update(id: number, data: UpdateArtisanInput) {
    try {
      // Intentar actualizar, si no existe lanzará error que captura el filtro global
      return await this.prisma.artisan.update({ where: { id }, data });
    } catch (error) {
      // Si el recurso no existe, lanzar excepción explícita
      if (error.code === 'P2025') {
        throw new NotFoundException('El artesano no existe');
      }
      throw error;
    }
  }

  /**
   * Elimina un artesano si no tiene productos ni ventas asociadas.
   * Lanza BadRequestException si tiene dependencias.
   * Lanza NotFoundException si no existe.
   */
  async remove(id: number) {
    // Verificar si tiene productos asociados
    const productsCount = await this.prisma.product.count({ where: { artisanId: id } });
    if (productsCount > 0) {
      throw new BadRequestException('No se puede eliminar un artesano con productos asociados.');
    }

    // Verificar si tiene ventas asociadas
    const salesCount = await this.prisma.sale.count({ where: { artisanId: id } });
    if (salesCount > 0) {
      throw new BadRequestException('No se puede eliminar un artesano con ventas asociadas.');
    }

    try {
      // Si no tiene dependencias, eliminar
      return await this.prisma.artisan.delete({ where: { id } });
    } catch (error) {
      // Si el recurso no existe, lanzar excepción explícita
      if (error.code === 'P2025') {
        throw new NotFoundException('El artesano no existe');
      }
      throw error;
    }
  }

  /**
   * Busca un artesano por ID y evento, incluyendo productos y ventas de ese evento.
   * Lanza NotFoundException si no existe.
   */
  async findByIdByEvent(artisanId: number, eventId: number) {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
      include: {
        products: { where: { eventId } },
        sales: { where: { eventId } },
      },
    });
    if (!artisan) {
      throw new NotFoundException('El artesano no existe');
    }
    return artisan;
  }
}