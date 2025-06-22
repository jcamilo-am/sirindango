import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getEventStatus } from '../../events/utils/event-status.util';
import { 
  CreateProductChangeInput, 
  ProductChangeCalculation, 
  ProductChangeValidation,
  ProductChangeStats
} from '../types/product-change.types';

/**
 * Helper para validaciones y cálculos relacionados con cambios de producto.
 * Centraliza toda la lógica de validación y cálculos complejos.
 */
export class ProductChangeValidationHelper {
  /**
   * Valida los datos básicos para crear un cambio de producto
   */
  static validateCreateProductChangeInput(data: CreateProductChangeInput): ProductChangeValidation {
    const errors: string[] = [];

    // Validar que los productos sean diferentes
    if (data.productReturnedId === data.productDeliveredId) {
      errors.push('El producto devuelto y el producto entregado deben ser diferentes');
    }

    // Validar coherencia en método de pago y fee
    if (data.paymentMethodDifference === 'CARD' && !data.cardFeeDifference) {
      errors.push('Si el método de pago es CARD, debe especificar el fee de tarjeta');
    }

    if (data.cardFeeDifference && data.paymentMethodDifference !== 'CARD') {
      errors.push('Solo se puede especificar fee de tarjeta si el método de pago es CARD');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida la existencia y estado de la venta
   */
  static async validateSale(prisma: PrismaService, saleId: number) {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { 
        event: true,
        artisan: true,
        product: true
      },
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    if (sale.state !== 'ACTIVE') {
      throw new BadRequestException('La venta ya fue cambiada o cancelada');
    }

    // Validar estado del evento
    const eventStatus = getEventStatus(sale.event);
    if (eventStatus !== 'ACTIVE') {
      throw new BadRequestException(
        'Solo se pueden registrar cambios de producto cuando el evento está en curso'
      );
    }

    return sale;
  }

  /**
   * Valida la existencia de los productos involucrados en el cambio
   */
  static async validateProducts(
    prisma: PrismaService, 
    productReturnedId: number, 
    productDeliveredId: number,
    saleEventId: number,
    saleArtisanId: number
  ) {
    const [productReturned, productDelivered] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productReturnedId },
        include: { artisan: true }
      }),
      prisma.product.findUnique({
        where: { id: productDeliveredId },
        include: { artisan: true }
      })
    ]);

    if (!productReturned) {
      throw new NotFoundException('Producto devuelto no encontrado');
    }

    if (!productDelivered) {
      throw new NotFoundException('Producto a entregar no encontrado');
    }

    // Validar que ambos productos pertenezcan al mismo evento y artesano que la venta
    if (
      productReturned.eventId !== saleEventId ||
      productDelivered.eventId !== saleEventId ||
      productReturned.artisanId !== saleArtisanId ||
      productDelivered.artisanId !== saleArtisanId
    ) {
      throw new BadRequestException(
        'Los productos deben pertenecer al mismo evento y artesano que la venta original'
      );
    }

    return { productReturned, productDelivered };
  }

  /**
   * Valida que no exista un cambio previo para la misma venta
   */
  static async validateNoDuplicateChange(prisma: PrismaService, saleId: number) {
    const existingChange = await prisma.productChange.findFirst({
      where: { saleId },
    });

    if (existingChange) {
      throw new BadRequestException('Ya existe un cambio registrado para esta venta');
    }
  }

  /**
   * Valida la cantidad a cambiar contra la cantidad vendida
   */
  static validateQuantity(quantityToChange: number, quantitySold: number) {
    if (quantityToChange > quantitySold) {
      throw new BadRequestException(
        `No se pueden cambiar ${quantityToChange} unidades. Solo se vendieron ${quantitySold} unidades`
      );
    }
  }

  /**
   * Valida el stock disponible del producto a entregar
   */
  static async validateStock(
    prisma: PrismaService, 
    productId: number, 
    requiredQuantity: number
  ) {
    const movements = await prisma.inventoryMovement.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });

    const availableStock = movements._sum.quantity ?? 0;
    
    if (availableStock < requiredQuantity) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${availableStock}, Requerido: ${requiredQuantity}`
      );
    }

    return availableStock;
  }

  /**
   * Calcula los valores relacionados con el cambio de producto
   */
  static calculateProductChangeValues(
    returnedProductPrice: number,
    deliveredProductPrice: number,
    quantity: number,
    paymentMethodDifference?: string,
    cardFeeDifference?: number
  ): ProductChangeCalculation {
    const valueDifference = (deliveredProductPrice - returnedProductPrice) * quantity;

    // No permitir cambios por productos de menor valor
    if (valueDifference < 0) {
      return {
        deliveredProductPrice,
        valueDifference: 0,
        isValidChange: false,
        errorMessage: 'No se permite cambiar por un producto de menor valor'
      };
    }

    // Validar coherencia del fee de tarjeta
    if (paymentMethodDifference === 'CARD' && cardFeeDifference === undefined && valueDifference > 0) {
      return {
        deliveredProductPrice,
        valueDifference,
        isValidChange: false,
        errorMessage: 'Debe especificar el fee de tarjeta para pagos con tarjeta'
      };
    }

    return {
      deliveredProductPrice,
      valueDifference,
      isValidChange: true
    };
  }

  /**
   * Calcula estadísticas de cambios de producto para un evento
   */
  static async calculateProductChangeStats(
    prisma: PrismaService,
    eventId: number
  ): Promise<ProductChangeStats> {
    const changes = await prisma.productChange.findMany({
      where: {
        sale: {
          eventId,
          state: 'ACTIVE'
        }
      },
    });

    const totalChanges = changes.length;
    const totalValueDifference = changes.reduce((sum, change) => sum + change.valueDifference, 0);
    const totalCardFees = changes.reduce((sum, change) => sum + (change.cardFeeDifference || 0), 0);

    const cashChanges = changes.filter(change => 
      change.paymentMethodDifference === 'CASH' || change.valueDifference === 0
    ).length;
    const cardChanges = changes.filter(change => 
      change.paymentMethodDifference === 'CARD'
    ).length;

    return {
      totalChanges,
      totalValueDifference,
      totalCardFees,
      changesByPaymentMethod: {
        cash: cashChanges,
        card: cardChanges,
      },
    };
  }

  /**
   * Valida que un cambio de producto sea posible de realizar
   */
  static async validateCompleteProductChange(
    prisma: PrismaService,
    data: CreateProductChangeInput
  ) {
    // 1. Validar datos básicos
    const inputValidation = this.validateCreateProductChangeInput(data);
    if (!inputValidation.isValid) {
      throw new BadRequestException(inputValidation.errors.join(', '));
    }

    // 2. Validar venta
    const sale = await this.validateSale(prisma, data.saleId);

    // 3. Validar productos
    const { productReturned, productDelivered } = await this.validateProducts(
      prisma,
      data.productReturnedId,
      data.productDeliveredId,
      sale.eventId,
      sale.artisanId
    );

    // 4. Validar no duplicado
    await this.validateNoDuplicateChange(prisma, data.saleId);

    // 5. Validar cantidad
    this.validateQuantity(data.quantity, sale.quantitySold);

    // 6. Validar stock
    await this.validateStock(prisma, data.productDeliveredId, data.quantity);

    // 7. Calcular valores
    const calculation = this.calculateProductChangeValues(
      productReturned.price,
      productDelivered.price,
      data.quantity,
      data.paymentMethodDifference,
      data.cardFeeDifference
    );

    if (!calculation.isValidChange) {
      throw new BadRequestException(calculation.errorMessage);
    }

    return {
      sale,
      productReturned,
      productDelivered,
      calculation
    };
  }
}
