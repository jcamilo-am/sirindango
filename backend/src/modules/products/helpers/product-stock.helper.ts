/**
 * Helper para cálculos relacionados con stock de productos.
 * Centraliza la lógica de cálculo para mantener el service limpio.
 */
export class ProductStockHelper {
  /**
   * Calcula el stock actual de un producto usando una transacción específica.
   * Usado dentro de transacciones de Prisma.
   */
  static async getCurrentStockWithClient(
    productId: number,
    prisma: any,
  ): Promise<number> {
    const entradas = await prisma.inventoryMovement.aggregate({
      where: { productId, type: 'ENTRADA' },
      _sum: { quantity: true },
    });

    const salidas = await prisma.inventoryMovement.aggregate({
      where: { productId, type: 'SALIDA' },
      _sum: { quantity: true },
    });

    return (entradas._sum.quantity ?? 0) - (salidas._sum.quantity ?? 0);
  }

  /**
   * Calcula el stock actual de un producto usando el cliente principal de Prisma.
   * Usado fuera de transacciones.
   */
  static async getCurrentStock(
    productId: number,
    prisma: any,
  ): Promise<number> {
    const entradas = await prisma.inventoryMovement.aggregate({
      where: { productId, type: 'ENTRADA' },
      _sum: { quantity: true },
    });

    const salidas = await prisma.inventoryMovement.aggregate({
      where: { productId, type: 'SALIDA' },
      _sum: { quantity: true },
    });

    return (entradas._sum.quantity ?? 0) - (salidas._sum.quantity ?? 0);
  }

  /**
   * Agrega el stock calculado a un producto individual.
   */
  static async addStockToProduct(product: any, prisma: any): Promise<any> {
    const stock = await this.getCurrentStock(product.id, prisma);
    return { ...product, stock };
  }

  /**
   * Agrega el stock calculado a una lista de productos.
   */
  static async addStockToProducts(
    products: any[],
    prisma: any,
  ): Promise<any[]> {
    return Promise.all(
      products.map((product) => this.addStockToProduct(product, prisma)),
    );
  }
}
