import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Helper para validaciones relacionadas con ventas.
 * Centraliza todas las validaciones de negocio.
 */
export class SaleValidationHelper {
  /**
   * Valida que una venta exista.
   */
  static async validateSaleExists(prisma: PrismaService, id: number): Promise<void> {
    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }
  }

  /**
   * Valida que un producto exista y esté disponible para venta.
   */
  static async validateProductForSale(
    prisma: PrismaService, 
    productId: number, 
    eventId: number
  ): Promise<any> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { artisan: true },
    });

    if (!product) {
      throw new BadRequestException('Producto no encontrado');
    }

    if (product.eventId !== eventId) {
      throw new BadRequestException('El producto no pertenece al evento especificado');
    }    // Los productos no tienen campo isActive en el esquema actual
    // Si necesitas validación de estado del producto, debes agregar el campo al esquema

    return product;
  }

  /**
   * Valida que un artesano exista y esté activo.
   */
  static async validateArtisanForSale(
    prisma: PrismaService, 
    artisanId: number
  ): Promise<void> {
    const artisan = await prisma.artisan.findUnique({
      where: { id: artisanId },
    });

    if (!artisan) {
      throw new BadRequestException('Artesano no encontrado');
    }    if (!artisan.active) {
      throw new BadRequestException('El artesano no está activo');
    }
  }

  /**
   * Valida que un evento exista y esté activo para ventas.
   */
  static async validateEventForSale(
    prisma: PrismaService, 
    eventId: number
  ): Promise<void> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new BadRequestException('Evento no encontrado');
    }

    // Validar que el evento esté en fechas válidas para ventas
    const now = new Date();
    if (now < event.startDate) {
      throw new BadRequestException('El evento aún no ha comenzado');
    }

    if (now > event.endDate) {
      throw new BadRequestException('El evento ya ha finalizado');
    }
  }

  /**
   * Valida los datos de una venta individual.
   */
  static validateSaleData(data: {
    quantitySold: number;
    valueCharged: number;
    paymentMethod: string;
    cardFee?: number;
  }): void {
    if (data.quantitySold <= 0) {
      throw new BadRequestException('La cantidad vendida debe ser mayor a cero');
    }

    if (data.valueCharged <= 0) {
      throw new BadRequestException('El valor cobrado debe ser mayor a cero');
    }

    if (data.paymentMethod === 'CARD' && !data.cardFee) {
      throw new BadRequestException('El fee de tarjeta es requerido para pagos con tarjeta');
    }

    if (data.paymentMethod === 'CASH' && data.cardFee && data.cardFee > 0) {
      throw new BadRequestException('No se puede cobrar fee de tarjeta en pagos en efectivo');
    }

    if (data.cardFee && data.cardFee < 0) {
      throw new BadRequestException('El fee de tarjeta no puede ser negativo');
    }
  }

  /**
   * Valida que se pueda cancelar una venta.
   */
  static async validateCanCancelSale(
    prisma: PrismaService, 
    saleId: number
  ): Promise<void> {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        changes: true,
        movements: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    if (sale.state === 'CANCELLED') {
      throw new BadRequestException('La venta ya está cancelada');
    }

    // Validar que no tenga cambios asociados
    if (sale.changes && sale.changes.length > 0) {
      throw new BadRequestException('No se puede cancelar una venta que tiene cambios asociados');
    }

    // Validar tiempo límite para cancelación (por ejemplo, 24 horas)
    const hoursSinceCreation = (new Date().getTime() - sale.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new BadRequestException('No se puede cancelar una venta después de 24 horas');
    }
  }

  /**
   * Valida que todos los productos de una venta múltiple pertenezcan al mismo evento.
   */
  static async validateMultiSaleProducts(
    prisma: PrismaService,
    eventId: number,
    productIds: number[]
  ): Promise<any[]> {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { artisan: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Uno o más productos no existen');
    }

    const invalidProducts = products.filter(p => p.eventId !== eventId);
    if (invalidProducts.length > 0) {
      throw new BadRequestException('Todos los productos deben pertenecer al mismo evento');
    }    // Los productos no tienen campo de estado en el esquema actual
    // Si necesitas validación de estado del producto, debes agregar el campo al esquema

    return products;
  }

  /**
   * Valida que todos los artesanos de una venta múltiple estén activos.
   */
  static async validateMultiSaleArtisans(
    prisma: PrismaService,
    artisanIds: number[]
  ): Promise<void> {
    const uniqueArtisanIds = [...new Set(artisanIds)];
    const artisans = await prisma.artisan.findMany({
      where: { id: { in: uniqueArtisanIds } },
    });

    if (artisans.length !== uniqueArtisanIds.length) {
      throw new BadRequestException('Uno o más artesanos no existen');
    }    const inactiveArtisans = artisans.filter(a => !a.active);
    if (inactiveArtisans.length > 0) {
      throw new BadRequestException('Uno o más artesanos no están activos');
    }
  }
}
