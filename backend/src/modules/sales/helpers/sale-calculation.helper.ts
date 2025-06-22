import { PrismaService } from '../../prisma/prisma.service';

/**
 * Helper para cálculos y utilidades relacionadas con ventas.
 * Centraliza toda la lógica de cálculos complejos.
 */
export class SaleCalculationHelper {
  /**
   * Calcula el valor total a cobrar basado en el precio del producto y la cantidad.
   */
  static calculateValueCharged(productPrice: number, quantitySold: number): number {
    if (productPrice <= 0 || quantitySold <= 0) {
      throw new Error('El precio del producto y la cantidad deben ser mayores a cero');
    }
    
    return productPrice * quantitySold;
  }
  /**
   * Calcula el fee de tarjeta prorrateado para cada item en una venta múltiple.
   */
  static calculateProportionalCardFee<T extends { valueCharged: number }>(
    items: T[],
    totalCardFee: number
  ): Array<T & { cardFee: number }> {
    const totalValue = items.reduce((sum, item) => sum + item.valueCharged, 0);
    
    if (totalValue <= 0) {
      return items.map(item => ({ ...item, cardFee: 0 }));
    }

    return items.map(item => ({
      ...item,
      cardFee: totalValue > 0 ? (totalCardFee * (item.valueCharged / totalValue)) : 0,
    }));
  }

  /**
   * Calcula las estadísticas de ventas por artesano.
   */
  static async calculateArtisanSalesStats(
    prisma: PrismaService,
    artisanId: number,
    eventId?: number
  ): Promise<{
    totalSales: number;
    totalAmount: number;
    totalCardFees: number;
    averageSaleAmount: number;
  }> {
    const whereClause: any = {
      artisanId,
      state: 'ACTIVE',
    };

    if (eventId) {
      whereClause.eventId = eventId;
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
    });

    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.valueCharged, 0);
    const totalCardFees = sales.reduce((sum, sale) => sum + (sale.cardFee || 0), 0);
    const averageSaleAmount = totalSales > 0 ? totalAmount / totalSales : 0;

    return {
      totalSales,
      totalAmount,
      totalCardFees,
      averageSaleAmount,
    };
  }

  /**
   * Calcula las estadísticas de ventas por evento.
   */
  static async calculateEventSalesStats(
    prisma: PrismaService,
    eventId: number
  ): Promise<{
    totalSales: number;
    totalAmount: number;
    totalCardFees: number;
    salesByPaymentMethod: {
      cash: { count: number; amount: number };
      card: { count: number; amount: number; fees: number };
    };
  }> {
    const sales = await prisma.sale.findMany({
      where: {
        eventId,
        state: 'ACTIVE',
      },
    });

    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.valueCharged, 0);
    const totalCardFees = sales.reduce((sum, sale) => sum + (sale.cardFee || 0), 0);

    const cashSales = sales.filter(sale => sale.paymentMethod === 'CASH');
    const cardSales = sales.filter(sale => sale.paymentMethod === 'CARD');

    return {
      totalSales,
      totalAmount,
      totalCardFees,
      salesByPaymentMethod: {
        cash: {
          count: cashSales.length,
          amount: cashSales.reduce((sum, sale) => sum + sale.valueCharged, 0),
        },
        card: {
          count: cardSales.length,
          amount: cardSales.reduce((sum, sale) => sum + sale.valueCharged, 0),
          fees: cardSales.reduce((sum, sale) => sum + (sale.cardFee || 0), 0),
        },
      },
    };
  }

  /**
   * Calcula las comisiones para una venta.
   */
  static calculateCommissions(
    saleAmount: number,
    commissionAssociation: number,
    commissionSeller: number
  ): {
    associationCommission: number;
    sellerCommission: number;
    netAmount: number;
  } {
    const associationCommission = (saleAmount * commissionAssociation) / 100;
    const sellerCommission = (saleAmount * commissionSeller) / 100;
    const netAmount = saleAmount - associationCommission - sellerCommission;

    return {
      associationCommission,
      sellerCommission,
      netAmount,
    };
  }

  /**
   * Calcula las ventas agrupadas por fecha para un período dado.
   */
  static async calculateSalesByDateRange(
    prisma: PrismaService,
    startDate: Date,
    endDate: Date,
    eventId?: number
  ): Promise<Array<{
    date: string;
    totalSales: number;
    totalAmount: number;
    cashSales: number;
    cardSales: number;
  }>> {
    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      state: 'ACTIVE',
    };

    if (eventId) {
      whereClause.eventId = eventId;
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });

    // Agrupar ventas por fecha
    const salesByDate = new Map<string, any>();

    sales.forEach(sale => {
      const dateKey = sale.date.toISOString().split('T')[0]; // Solo la fecha, sin hora
      
      if (!salesByDate.has(dateKey)) {
        salesByDate.set(dateKey, {
          date: dateKey,
          totalSales: 0,
          totalAmount: 0,
          cashSales: 0,
          cardSales: 0,
        });
      }

      const dateStats = salesByDate.get(dateKey);
      dateStats.totalSales += 1;
      dateStats.totalAmount += sale.valueCharged;
      
      if (sale.paymentMethod === 'CASH') {
        dateStats.cashSales += 1;
      } else {
        dateStats.cardSales += 1;
      }
    });

    return Array.from(salesByDate.values());
  }

  /**
   * Calcula el top de productos más vendidos.
   */
  static async calculateTopSellingProducts(
    prisma: PrismaService,
    eventId: number,
    limit: number = 10
  ): Promise<Array<{
    productId: number;
    productName: string;
    totalQuantitySold: number;
    totalAmount: number;
    salesCount: number;
  }>> {
    const sales = await prisma.sale.findMany({
      where: {
        eventId,
        state: 'ACTIVE',
      },
      include: {
        product: true,
      },
    });

    // Agrupar por producto
    const productStats = new Map<number, any>();

    sales.forEach(sale => {
      const productId = sale.productId;
      
      if (!productStats.has(productId)) {
        productStats.set(productId, {
          productId,
          productName: sale.product.name,
          totalQuantitySold: 0,
          totalAmount: 0,
          salesCount: 0,
        });
      }

      const stats = productStats.get(productId);
      stats.totalQuantitySold += sale.quantitySold;
      stats.totalAmount += sale.valueCharged;
      stats.salesCount += 1;
    });

    return Array.from(productStats.values())
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, limit);
  }
}
