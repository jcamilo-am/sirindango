import { PrismaService } from '../../prisma/prisma.service';

/**
 * Helper para operaciones de inventario relacionadas con cambios de producto.
 * Centraliza la lógica de movimientos de inventario.
 */
export class ProductChangeInventoryHelper {
  /**
   * Crea los movimientos de inventario necesarios para un cambio de producto
   */
  static async createInventoryMovements(
    prisma: PrismaService,
    productChangeId: number,
    productReturnedId: number,
    productDeliveredId: number,
    quantity: number
  ) {
    const operations: string[] = [];

    // Movimiento ENTRADA: producto original devuelto al inventario
    await prisma.inventoryMovement.create({
      data: {
        type: 'ENTRADA',
        quantity: quantity,
        reason: 'Devolución por cambio de producto',
        productId: productReturnedId,
        changeId: productChangeId,
      },
    });
    operations.push(`Entrada de ${quantity} unidades del producto devuelto`);

    // Movimiento SALIDA: producto nuevo entregado desde el inventario
    await prisma.inventoryMovement.create({
      data: {
        type: 'SALIDA',
        quantity: quantity,
        reason: 'Entrega por cambio de producto',
        productId: productDeliveredId,
        changeId: productChangeId,
      },
    });
    operations.push(`Salida de ${quantity} unidades del producto entregado`);

    return operations;
  }

  /**
   * Actualiza el estado de la venta si es necesario
   */
  static async updateSaleStateIfNeeded(
    prisma: PrismaService,
    saleId: number,
    quantityChanged: number,
    quantitySold: number
  ): Promise<string[]> {
    const operations: string[] = [];

    // Si se cambió toda la cantidad vendida, marcar la venta como CHANGED
    if (quantityChanged === quantitySold) {
      await prisma.sale.update({
        where: { id: saleId },
        data: { state: 'CHANGED' },
      });
      operations.push('Estado de venta actualizado a CHANGED');
    }

    return operations;
  }

  /**
   * Calcula el stock actual de un producto
   */
  static async calculateCurrentStock(
    prisma: PrismaService,
    productId: number
  ): Promise<number> {
    const movements = await prisma.inventoryMovement.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });

    return movements._sum.quantity ?? 0;
  }

  /**
   * Obtiene el historial de movimientos de inventario para un cambio de producto
   */
  static async getMovementsByChange(
    prisma: PrismaService,
    changeId: number
  ) {
    return await prisma.inventoryMovement.findMany({
      where: { changeId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Revierte los movimientos de inventario de un cambio (para casos de rollback)
   */
  static async revertInventoryMovements(
    prisma: PrismaService,
    changeId: number
  ) {
    const movements = await this.getMovementsByChange(prisma, changeId);
    const operations: string[] = [];

    for (const movement of movements) {
      // Crear movimiento inverso
      const reverseType = movement.type === 'ENTRADA' ? 'SALIDA' : 'ENTRADA';
      
      await prisma.inventoryMovement.create({
        data: {
          type: reverseType,
          quantity: movement.quantity,
          reason: `Reversión de cambio: ${movement.reason}`,
          productId: movement.productId,
          changeId: changeId,
        },
      });

      operations.push(`Revertido: ${reverseType} de ${movement.quantity} unidades`);
    }

    return operations;
  }
  /**
   * Valida que hay suficiente stock para múltiples productos
   */
  static async validateMultipleProductsStock(
    prisma: PrismaService,
    productRequirements: Array<{ productId: number; quantity: number }>
  ): Promise<Array<{ productId: number; available: number; required: number; sufficient: boolean }>> {
    const results: Array<{ productId: number; available: number; required: number; sufficient: boolean }> = [];

    for (const requirement of productRequirements) {
      const currentStock = await this.calculateCurrentStock(prisma, requirement.productId);
      results.push({
        productId: requirement.productId,
        available: currentStock,
        required: requirement.quantity,
        sufficient: currentStock >= requirement.quantity,
      });
    }

    return results;
  }

  /**
   * Obtiene resumen de stock por evento
   */
  static async getEventStockSummary(
    prisma: PrismaService,
    eventId: number
  ) {
    const products = await prisma.product.findMany({
      where: { eventId },
      include: {
        movements: {
          select: {
            quantity: true,
          }
        }
      },
    });

    return products.map(product => {
      const totalStock = product.movements.reduce((sum, movement) => sum + movement.quantity, 0);
      return {
        productId: product.id,
        productName: product.name,
        currentStock: totalStock,
        price: product.price,
      };
    });
  }
}
