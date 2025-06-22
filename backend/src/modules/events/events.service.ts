import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import {
  EventEntity,
  EventWithSummaryEntity,
  EventWithAccountingEntity,
} from './entities/event.entity';
import { EventValidationHelper } from './helpers/event-validation.helper';
import { EventStatsHelper } from './helpers/event-stats.helper';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo evento con estado SCHEDULED por defecto.
   */
  async create(data: CreateEventDto): Promise<EventEntity> {
    // Validar fechas usando helper
    EventValidationHelper.validateEventDates(data.startDate, data.endDate);
    const event = await this.prisma.event.create({
      data: {
        name: data.name,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        commissionAssociation: data.commissionAssociation,
        commissionSeller: data.commissionSeller,
        state: 'SCHEDULED' as any,
      },
    });

    return EventEntity.fromPrisma(event);
  }

  /**
   * Lista todos los eventos.
   */
  async findAll(): Promise<EventEntity[]> {
    const events = await this.prisma.event.findMany();
    return events.map((event) => EventEntity.fromPrisma(event));
  }

  /**
   * Busca un evento por ID.
   */
  async findOne(id: number): Promise<EventEntity> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    return EventEntity.fromPrisma(event);
  }
  /**
   * Actualiza un evento por ID.
   */
  async update(id: number, data: UpdateEventDto): Promise<EventEntity> {
    // Verificar que el evento existe
    await this.findOne(id);

    // Validar fechas si se proporcionan
    if (data.startDate || data.endDate) {
      const existingEvent = await this.prisma.event.findUnique({
        where: { id },
      });
      if (!existingEvent) {
        throw new NotFoundException('Evento no encontrado');
      }
      const startDate = data.startDate || existingEvent.startDate;
      const endDate = data.endDate || existingEvent.endDate;
      EventValidationHelper.validateEventDates(startDate, endDate);
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data,
    });

    return EventEntity.fromPrisma(updatedEvent);
  }

  /**
   * Busca eventos por nombre (búsqueda parcial).
   */
  async findByName(name: string): Promise<EventEntity[]> {
    const events = await this.prisma.event.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
    });

    return events.map((event) => EventEntity.fromPrisma(event));
  }

  /**
   * Cierra un evento (cambia el estado a CLOSED).
   */
  async closeEvent(id: number): Promise<EventEntity> {
    // Verificar que el evento existe
    await this.findOne(id);
    const closedEvent = await this.prisma.event.update({
      where: { id },
      data: { state: 'CLOSED' as any },
    });

    return EventEntity.fromPrisma(closedEvent);
  }

  /**
   * Obtiene el resumen de un evento con totales y estadísticas.
   */
  async getEventSummary(id: number): Promise<EventWithSummaryEntity> {
    const event = await this.findOne(id);

    // Obtener el conteo de ventas
    const salesCount = await this.prisma.sale.count({
      where: { eventId: id },
    });

    // Obtener totales agrupados por método de pago usando helper
    const salesByPaymentMethod = await EventStatsHelper.getSalesByPaymentMethod(
      this.prisma,
      id,
    );

    // Calcular totales usando helper
    const totals = EventStatsHelper.calculateEventTotals(
      salesByPaymentMethod,
      event.commissionAssociation,
    );

    const summary = {
      totalSales: salesCount,
      salesByPaymentMethod,
      totalGross: totals.totalGross,
      totalCommissionAssociation: totals.totalCommissionAssociation,
      totalNetForArtisans: totals.totalNetForArtisans,
    };

    return EventWithSummaryEntity.fromEventAndSummary(event, summary);
  }

  /**
   * Obtiene el resumen contable detallado de un evento.
   */
  async getEventAccountingSummary(
    id: number,
  ): Promise<EventWithAccountingEntity> {
    const event = await this.findOne(id);

    // Obtener ventas detalladas con productos y artesanos
    const sales = await this.prisma.sale.findMany({
      where: { eventId: id },
      include: {
        product: {
          include: {
            artisan: true,
          },
        },
      },
    });

    // Calcular resumen contable por artesano usando helper
    const accountingSummary = EventStatsHelper.calculateAccountingSummary(
      sales,
      event.commissionAssociation,
      event.commissionSeller,
    );

    return EventWithAccountingEntity.fromEventAndAccounting(
      event,
      accountingSummary,
    );
  }
}
