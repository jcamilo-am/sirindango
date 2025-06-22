import { ApiProperty } from '@nestjs/swagger';
import { EventStatsHelper } from '../helpers/event-stats.helper';
import { EventAccountingSummaryDto } from '../dto/event-accounting-summary.dto';

/**
 * Entidad Event para respuestas de la API.
 * Representa la estructura de un evento en las respuestas.
 */
export class EventEntity {
  @ApiProperty({ example: 1, description: 'ID único del evento' })
  id: number;

  @ApiProperty({
    example: 'Feria Artesanal 2025',
    description: 'Nombre del evento',
  })
  name: string;

  @ApiProperty({
    example: 'Plaza Central, Bogotá',
    description: 'Ubicación del evento',
  })
  location: string;

  @ApiProperty({
    example: '2025-07-01T10:00:00.000Z',
    description: 'Fecha y hora de inicio',
  })
  startDate: Date;

  @ApiProperty({
    example: '2025-07-05T18:00:00.000Z',
    description: 'Fecha y hora de finalización',
  })
  endDate: Date;

  @ApiProperty({
    example: 10,
    description: 'Porcentaje de comisión para la asociación',
  })
  commissionAssociation: number;

  @ApiProperty({
    example: 5,
    description: 'Porcentaje de comisión para el vendedor',
  })
  commissionSeller: number;

  @ApiProperty({
    example: 'UPCOMING',
    enum: ['UPCOMING', 'ACTIVE', 'CLOSED'],
    description: 'Estado calculado del evento basado en las fechas',
  })
  status: 'UPCOMING' | 'ACTIVE' | 'CLOSED';

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Fecha de creación',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Fecha de última actualización',
  })
  updatedAt: Date;

  /**
   * Crea una instancia de EventEntity desde un objeto de Prisma.
   */
  static fromPrisma(event: any): EventEntity {
    const entity = new EventEntity();
    entity.id = event.id;
    entity.name = event.name;
    entity.location = event.location;
    entity.startDate = event.startDate;
    entity.endDate = event.endDate;
    entity.commissionAssociation = event.commissionAssociation;
    entity.commissionSeller = event.commissionSeller;
    entity.status = EventStatsHelper.getEventStatus(event);
    entity.createdAt = event.createdAt;
    entity.updatedAt = event.updatedAt;
    return entity;
  }
}

/**
 * Entidad Event con resumen de ventas.
 * Usada cuando se necesita información de ventas y artesanos relacionados.
 */
export class EventWithSummaryEntity extends EventEntity {
  @ApiProperty({
    description: 'Resumen de ventas del evento',
    type: 'object',
    properties: {
      totalSales: { type: 'number', example: 25 },
      salesByPaymentMethod: {
        type: 'array',
        example: [{ paymentMethod: 'EFECTIVO', total: 100 }],
      },
      totalGross: { type: 'number', example: 150000 },
      totalCommissionAssociation: { type: 'number', example: 15000 },
      totalNetForArtisans: { type: 'number', example: 135000 },
    },
  })
  summary: {
    totalSales: number;
    salesByPaymentMethod: Array<{
      paymentMethod: string;
      _sum: { total: number | null };
    }>;
    totalGross: number;
    totalCommissionAssociation: number;
    totalNetForArtisans: number;
  };

  /**
   * Crea una instancia desde un evento y su resumen.
   */
  static fromEventAndSummary(
    event: EventEntity,
    summary: any,
  ): EventWithSummaryEntity {
    const entity = new EventWithSummaryEntity();
    Object.assign(entity, event);
    entity.summary = summary;
    return entity;
  }
}

/**
 * Entidad Event con información contable completa.
 * Usada para reportes contables y resúmenes financieros.
 */
export class EventWithAccountingEntity extends EventEntity {
  @ApiProperty({
    description: 'Información contable detallada del evento',
    type: 'object',
    properties: {
      artisans: { type: 'array', description: 'Detalle por artesano' },
      totals: {
        type: 'object',
        properties: {
          gross: { type: 'number', example: 150000 },
          commissionAssociation: { type: 'number', example: 15000 },
          commissionSeller: { type: 'number', example: 7500 },
          net: { type: 'number', example: 127500 },
        },
      },
    },
  })
  accounting: {
    artisans: any[];
    totals: {
      gross: number;
      commissionAssociation: number;
      commissionSeller: number;
      net: number;
    };
  };

  /**
   * Crea una instancia desde un evento y su información contable.
   */
  static fromEventAndAccounting(
    event: EventEntity,
    accounting: any,
  ): EventWithAccountingEntity {
    const entity = new EventWithAccountingEntity();
    Object.assign(entity, event);
    entity.accounting = accounting;
    return entity;
  }

  /**
   * Convierte la entidad a DTO para generación de PDF.
   */
  toPdfDto(): EventAccountingSummaryDto {
    return {
      eventId: this.id,
      eventName: this.name,
      startDate: this.startDate,
      endDate: this.endDate,
      commissionAssociationPercent: this.commissionAssociation,
      commissionSellerPercent: this.commissionSeller,
      artisans: this.accounting.artisans.map((artisan: any) => ({
        artisanId: artisan.artisan.id,
        artisanName: artisan.artisan.name,
        artisanIdentification: artisan.artisan.identification || '', // Default if not available
        sales: artisan.sales.map((sale: any) => ({
          saleId: sale.id,
          date: sale.createdAt || new Date(),
          productId: sale.product?.id || 0,
          productName: sale.product?.name || '',
          quantitySold: sale.quantitySold,
          valueCharged: sale.valueCharged,
          paymentMethod: sale.paymentMethod,
          cardFee: sale.cardFee || 0,
          type: sale.type || 'VENTA',
          valueDifference: sale.valueDifference || 0,
          unitPrice: sale.product?.price || 0,
        })),
        totalSold: artisan.totals.gross,
        totalCardFees: artisan.sales.reduce(
          (sum: number, sale: any) => sum + (sale.cardFee || 0),
          0,
        ),
        commissionAssociation: artisan.totals.commissionAssociation,
        commissionSeller: artisan.totals.commissionSeller,
        netReceived: artisan.totals.net,
      })),
      totalSold: this.accounting.totals.gross,
      totalCardFees: this.accounting.artisans.reduce(
        (sum: number, artisan: any) =>
          sum +
          artisan.sales.reduce(
            (saleSum: number, sale: any) => saleSum + (sale.cardFee || 0),
            0,
          ),
        0,
      ),
      totalCommissionAssociation: this.accounting.totals.commissionAssociation,
      totalCommissionSeller: this.accounting.totals.commissionSeller,
      totalNetReceived: this.accounting.totals.net,
    };
  }
}
