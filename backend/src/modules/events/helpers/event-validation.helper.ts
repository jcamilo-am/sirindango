import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Helper para validaciones relacionadas con eventos.
 * Centraliza todas las validaciones de negocio.
 */
export class EventValidationHelper {
  /**
   * Valida que las fechas del evento sean válidas.
   */
  static validateEventDates(startDate: Date, endDate: Date): void {
    const now = new Date();

    if (startDate >= endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    if (startDate < now) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser en el pasado',
      );
    }
  }

  /**
   * Valida que el nombre del evento sea único.
   */
  static async validateUniqueName(
    prisma: PrismaService,
    name: string,
    excludeId?: number,
  ): Promise<void> {
    const existingEvent = await prisma.event.findFirst({
      where: {
        name,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    if (existingEvent) {
      throw new BadRequestException('Ya existe un evento con ese nombre');
    }
  }

  /**
   * Valida que el evento exista.
   */
  static async validateEventExists(
    prisma: PrismaService,
    id: number,
  ): Promise<void> {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }
  }

  /**
   * Valida que se pueda eliminar un evento (no tiene productos o ventas).
   */
  static async validateCanDelete(
    prisma: PrismaService,
    eventId: number,
  ): Promise<void> {
    const productsCount = await prisma.product.count({
      where: { eventId },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el evento porque tiene productos asociados',
      );
    }

    const salesCount = await prisma.sale.count({
      where: { eventId },
    });

    if (salesCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el evento porque tiene ventas registradas',
      );
    }
  }

  /**
   * Valida que se pueda actualizar un evento.
   */
  static async validateCanUpdate(
    prisma: PrismaService,
    eventId: number,
    updateData: any,
  ): Promise<void> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    // No permitir cambiar fechas si el evento ya tiene ventas
    if (updateData.startDate || updateData.endDate) {
      const salesCount = await prisma.sale.count({
        where: { eventId },
      });

      if (salesCount > 0) {
        throw new BadRequestException(
          'No se pueden cambiar las fechas de un evento que ya tiene ventas',
        );
      }
    }
  }
}
