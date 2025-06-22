/**
 * Helper para cálculos y estadísticas relacionadas con artesanos.
 * Centraliza la lógica de cálculo para mantener el service limpio.
 */
export class ArtisanStatsHelper {
  /**
   * Calcula estadísticas de productos para un artesano.
   */
  static async calculateProductStats(
    artisanId: number,
    prisma: any,
  ): Promise<{
    totalProducts: number;
    totalValue: number;
    averagePrice: number;
  }> {
    const products = await prisma.product.findMany({
      where: { artisanId },
      select: { price: true },
    });

    const totalProducts = products.length;
    const totalValue = products.reduce(
      (sum, product) => sum + product.price,
      0,
    );
    const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;

    return {
      totalProducts,
      totalValue,
      averagePrice: Math.round(averagePrice * 100) / 100, // Redondear a 2 decimales
    };
  }

  /**
   * Calcula estadísticas de productos activos para un artesano.
   */
  static async calculateActiveProductStats(
    artisanId: number,
    prisma: any,
  ): Promise<{
    activeProducts: number;
    activeEventsCount: number;
    totalActiveValue: number;
  }> {
    const activeProducts = await prisma.product.findMany({
      where: {
        artisanId,
        event: {
          state: { not: 'CLOSED' },
        },
      },
      include: {
        event: true,
      },
    });

    const activeEventsCount = new Set(
      activeProducts.map((product) => product.event.id),
    ).size;

    const totalActiveValue = activeProducts.reduce(
      (sum, product) => sum + product.price,
      0,
    );

    return {
      activeProducts: activeProducts.length,
      activeEventsCount,
      totalActiveValue,
    };
  }

  /**
   * Agrega estadísticas de productos a un artesano.
   */
  static async addProductStatsToArtisan(
    artisan: any,
    prisma: any,
  ): Promise<any> {
    const productSummary = await this.calculateProductStats(artisan.id, prisma);
    return { ...artisan, productSummary };
  }

  /**
   * Agrega estadísticas de productos a una lista de artesanos.
   */
  static async addProductStatsToArtisans(
    artisans: any[],
    prisma: any,
  ): Promise<any[]> {
    return Promise.all(
      artisans.map((artisan) => this.addProductStatsToArtisan(artisan, prisma)),
    );
  }
}
