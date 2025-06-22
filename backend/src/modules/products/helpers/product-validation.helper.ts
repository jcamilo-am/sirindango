import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getEventStatus } from '../../events/utils/event-status.util';

/**
 * Helper para validaciones del módulo de productos.
 * Centraliza la lógica de validación para mantener el service limpio.
 */
export class ProductValidationHelper {
  constructor(private prisma: PrismaService) {}

  /**
   * Valida que un evento exista y esté en estado editable.
   */
  async validateEventEditable(eventId: number): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('El evento no existe');
    }

    const status = getEventStatus(event);
    if (status === 'CLOSED') {
      throw new BadRequestException(
        'No se pueden crear productos en eventos cerrados',
      );
    }
  }

  /**
   * Valida que un evento exista (sin restricciones de estado).
   */
  async validateEvent(data: { eventId: number }): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: data.eventId },
    });
    if (!event) {
      throw new NotFoundException('El evento no existe');
    }
  }

  /**
   * Valida que un artesano exista y esté activo.
   */
  async validateArtisan(artisanId: number): Promise<void> {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
    });
    if (!artisan) {
      throw new NotFoundException('El artesano no existe');
    }
    if (artisan.active === false) {
      throw new BadRequestException('El artesano no está activo');
    }
  }

  /**
   * Valida que no exista un producto con el mismo nombre para el mismo artesano en el mismo evento.
   */
  async validateUniqueProductName(
    name: string,
    eventId: number,
    artisanId: number,
    excludeId?: number,
  ): Promise<void> {
    const where: any = {
      name,
      eventId,
      artisanId,
    };

    // Excluir el producto actual en caso de actualización
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const exists = await this.prisma.product.findFirst({ where });
    if (exists) {
      throw new BadRequestException(
        'Ya existe un producto con ese nombre para este artesano en este evento',
      );
    }
  }

  /**
   * Valida que un producto exista.
   */
  async validateProductExists(id: number): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('El producto no existe');
    }
  }
}
