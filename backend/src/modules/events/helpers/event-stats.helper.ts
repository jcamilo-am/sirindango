import { PrismaService } from '../../prisma/prisma.service';

/**
 * Helper para cálculos y estadísticas relacionadas con eventos.
 * Centraliza toda la lógica de cálculos complejos.
 */
export class EventStatsHelper {
  /**
   * Calcula el estado de un evento basado en las fechas actuales.
   */
  static getEventStatus(event: {
    startDate: Date;
    endDate: Date;
  }): 'UPCOMING' | 'ACTIVE' | 'CLOSED' {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (now < startDate) {
      return 'UPCOMING';
    } else if (now >= startDate && now <= endDate) {
      return 'ACTIVE';
    } else {
      return 'CLOSED';
    }
  }
  /**
   * Obtiene ventas agrupadas por método de pago.
   */
  static async getSalesByPaymentMethod(prisma: PrismaService, eventId: number) {
    return await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: { eventId },
      _sum: {
        valueCharged: true,
      },
    });
  }

  /**
   * Calcula totales de un evento.
   */
  static calculateEventTotals(
    salesByPaymentMethod: Array<{
      paymentMethod: string;
      _sum: { valueCharged: number | null };
    }>,
    commissionAssociation: number,
  ) {
    const totalGross = salesByPaymentMethod.reduce(
      (sum, group) => sum + (group._sum.valueCharged || 0),
      0,
    );

    const totalCommissionAssociation =
      (totalGross * commissionAssociation) / 100;
    const totalNetForArtisans = totalGross - totalCommissionAssociation;

    return {
      totalGross,
      totalCommissionAssociation,
      totalNetForArtisans,
    };
  } /**
   * Calcula resumen contable por artesano.
   */
  static calculateAccountingSummary(
    sales: Array<{
      id: number;
      quantitySold: number;
      valueCharged: number;
      paymentMethod: string;
      product: {
        artisan: {
          id: number;
          name: string;
        };
      };
    }>,
    commissionAssociation: number,
    commissionSeller: number,
  ) {
    // Agrupar por artesano
    const artisanGroups = sales.reduce(
      (groups, sale) => {
        const artisanId = sale.product.artisan.id;
        if (!groups[artisanId]) {
          groups[artisanId] = {
            artisan: sale.product.artisan,
            sales: [],
            totals: {
              gross: 0,
              commissionAssociation: 0,
              commissionSeller: 0,
              net: 0,
            },
          };
        }
        groups[artisanId].sales.push(sale);
        return groups;
      },
      {} as Record<number, any>,
    );

    // Calcular totales por artesano
    Object.values(artisanGroups).forEach((group: any) => {
      const gross = group.sales.reduce(
        (sum: number, sale: any) => sum + sale.valueCharged,
        0,
      );
      const commAssociation = (gross * commissionAssociation) / 100;
      const commSeller = (gross * commissionSeller) / 100;
      const net = gross - commAssociation - commSeller;

      group.totals = {
        gross,
        commissionAssociation: commAssociation,
        commissionSeller: commSeller,
        net,
      };
    });

    // Calcular totales generales
    const totalGross = Object.values(artisanGroups).reduce(
      (sum: number, group: any) => sum + group.totals.gross,
      0,
    );
    const totalCommissionAssociation =
      (totalGross * commissionAssociation) / 100;
    const totalCommissionSeller = (totalGross * commissionSeller) / 100;
    const totalNet =
      totalGross - totalCommissionAssociation - totalCommissionSeller;

    return {
      artisans: Object.values(artisanGroups),
      totals: {
        gross: totalGross,
        commissionAssociation: totalCommissionAssociation,
        commissionSeller: totalCommissionSeller,
        net: totalNet,
      },
    };
  }
}
