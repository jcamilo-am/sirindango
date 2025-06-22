import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Helper para validaciones del módulo de artesanos.
 * Centraliza la lógica de validación para mantener el service limpio.
 */
export class ArtisanValidationHelper {
  constructor(private prisma: PrismaService) {}

  /**
   * Valida que un artesano exista.
   */
  async validateArtisanExists(id: number): Promise<void> {
    const artisan = await this.prisma.artisan.findUnique({ where: { id } });
    if (!artisan) {
      throw new NotFoundException('El artesano no existe');
    }
  }

  /**
   * Valida que no exista un artesano con la misma identificación.
   */
  async validateUniqueIdentification(
    identification: string,
    excludeId?: number,
  ): Promise<void> {
    const where: any = { identification };

    // Excluir el artesano actual en caso de actualización
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const exists = await this.prisma.artisan.findFirst({ where });
    if (exists) {
      throw new BadRequestException(
        'Ya existe un artesano con este número de identificación',
      );
    }
  }

  /**
   * Valida que un artesano esté activo.
   */
  async validateArtisanActive(id: number): Promise<void> {
    const artisan = await this.prisma.artisan.findUnique({ where: { id } });
    if (!artisan) {
      throw new NotFoundException('El artesano no existe');
    }
    if (!artisan.active) {
      throw new BadRequestException('El artesano no está activo');
    }
  }

  /**
   * Valida que se pueda desactivar un artesano (no debe tener productos activos).
   */
  async validateCanDeactivate(id: number): Promise<void> {
    const activeProductsCount = await this.prisma.product.count({
      where: {
        artisanId: id,
        event: {
          state: { not: 'CLOSED' },
        },
      },
    });

    if (activeProductsCount > 0) {
      throw new BadRequestException(
        'No se puede desactivar un artesano que tiene productos en eventos activos',
      );
    }
  }

  /**
   * Valida que se pueda eliminar un artesano (no debe tener productos).
   */
  async validateCanDelete(id: number): Promise<void> {
    const productsCount = await this.prisma.product.count({
      where: { artisanId: id },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar un artesano que tiene productos registrados',
      );
    }
  }
}
