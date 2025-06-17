import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './types/create-product.type';
import { UpdateProductInput } from './types/update-product.type';
import { FindAllOptions } from './types/filters.type';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // Crea un producto, el filtro global maneja errores de unicidad
  async create(data: CreateProductInput) {
    try {
      return await this.prisma.product.create({ data });
    } catch (error) {
      throw error;
    }
  }

  // Busca productos con filtros opcionales
  async findAll(options: FindAllOptions = {}) {
    const { eventId, artisanId, order } = options;
    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (artisanId) where.artisanId = artisanId;
    let orderBy: any = undefined;
    if (order === 'name') orderBy = { name: 'asc' };
    if (order === 'quantity') orderBy = { availableQuantity: 'asc' };
    return await this.prisma.product.findMany({ where, orderBy });
  }

  // Busca un producto por ID, lanza NotFoundException si no existe
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('El producto no existe');
    return product;
  }

  // Actualiza un producto si no tiene ventas asociadas
  async update(id: number, data: UpdateProductInput) {
    // Verifica si el producto tiene ventas asociadas
    const salesCount = await this.prisma.sale.count({ where: { productId: id } });
    if (salesCount > 0) {
      throw new BadRequestException('No se puede actualizar un producto con ventas asociadas.');
    }
    try {
      return await this.prisma.product.update({ where: { id }, data });
    } catch (error) {
      // Si no existe, el filtro global lo maneja (P2025)
      throw error;
    }
  }

  // Elimina un producto si no tiene ventas asociadas
  async remove(id: number) {
    // Verifica si el producto tiene ventas asociadas
    const salesCount = await this.prisma.sale.count({ where: { productId: id } });
    if (salesCount > 0) {
      throw new BadRequestException('No se puede eliminar un producto con ventas asociadas.');
    }
    try {
      return await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      // Si no existe, el filtro global lo maneja (P2025)
      throw error;
    }
  }
}