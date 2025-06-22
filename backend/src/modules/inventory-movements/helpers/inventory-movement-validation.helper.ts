import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getEventStatus } from '../../events/utils/event-status.util';
import {
  CreateInventoryMovementInput,
  InventoryMovementValidation,
  ProductValidationResult,
  StockValidationResult
} from '../types/inventory-movement.types';

/**
 * Helper para validaciones de movimientos de inventario.
 * Centraliza toda la lógica de validación de negocio.
 */
export class InventoryMovementValidationHelper {
  /**
   * Valida los datos básicos de entrada para crear un movimiento
   */
  static validateCreateMovementInput(data: CreateInventoryMovementInput): InventoryMovementValidation {
    const errors: string[] = [];

    // Validar que no tenga tanto saleId como changeId
    if (data.saleId && data.changeId) {
      errors.push('Un movimiento no puede estar asociado tanto a una venta como a un cambio');
    }

    // Validar que la cantidad sea positiva
    if (data.quantity <= 0) {
      errors.push('La cantidad debe ser mayor a cero');
    }

    // Validar longitud de la razón si está presente
    if (data.reason && data.reason.length > 255) {
      errors.push('La razón no puede exceder 255 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida que el producto exista y esté en un estado válido
   */
  static async validateProduct(
    prisma: PrismaService,
    productId: number
  ): Promise<ProductValidationResult> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { 
        event: true,
        artisan: { select: { name: true } }
      },
    });

    if (!product) {
      throw new NotFoundException('El producto especificado no existe');
    }

    const eventStatus = getEventStatus(product.event);

    return {
      exists: true,
      eventId: product.eventId,
      eventStatus,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        artisanId: product.artisanId,
        eventId: product.eventId,
      }
    };
  }

  /**
   * Valida que el evento permita movimientos de inventario
   */
  static validateEventForMovement(eventStatus: string, movementType: 'ENTRADA' | 'SALIDA') {
    // Solo permitir movimientos de ENTRADA para eventos programados
    // Los movimientos de SALIDA solo se permiten durante eventos activos (ventas/cambios)
    if (movementType === 'ENTRADA' && eventStatus !== 'SCHEDULED') {
      throw new BadRequestException(
        'Solo se pueden registrar entradas de inventario para eventos programados'
      );
    }

    if (movementType === 'SALIDA' && eventStatus === 'CLOSED') {
      throw new BadRequestException(
        'No se pueden registrar salidas de inventario para eventos cerrados'
      );
    }
  }

  /**
   * Valida que hay suficiente stock para una salida
   */
  static async validateStock(
    prisma: PrismaService,
    productId: number,
    requestedQuantity: number
  ): Promise<StockValidationResult> {
    const currentStock = await this.calculateCurrentStock(prisma, productId);

    const hasEnoughStock = currentStock >= requestedQuantity;
    
    if (!hasEnoughStock) {
      return {
        hasEnoughStock: false,
        currentStock,
        requestedQuantity,
        shortfall: requestedQuantity - currentStock
      };
    }

    return {
      hasEnoughStock: true,
      currentStock,
      requestedQuantity
    };
  }
  /**
   * Valida que la venta exista y esté activa (si se proporciona saleId)
   */
  static async validateSale(prisma: PrismaService, saleId: number): Promise<any> {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { product: true }
    });

    if (!sale) {
      throw new NotFoundException('La venta asociada no existe');
    }

    if (sale.state !== 'ACTIVE') {
      throw new BadRequestException('Solo se pueden crear movimientos para ventas activas');
    }

    return sale;
  }

  /**
   * Valida que el cambio exista (si se proporciona changeId)
   */
  static async validateChange(prisma: PrismaService, changeId: number): Promise<any> {
    const change = await prisma.productChange.findUnique({
      where: { id: changeId },
      include: {
        returnedProduct: true,
        deliveredProduct: true
      }
    });

    if (!change) {
      throw new NotFoundException('El cambio de producto asociado no existe');
    }

    return change;
  }

  /**
   * Valida que no exista un movimiento duplicado
   */
  static async validateNoDuplicateMovement(
    prisma: PrismaService,
    data: CreateInventoryMovementInput
  ) {
    let whereClause: any = {
      productId: data.productId,
      type: data.type,
    };

    // Verificar duplicados por venta
    if (data.saleId) {
      whereClause.saleId = data.saleId;
      
      const existingMovement = await prisma.inventoryMovement.findFirst({
        where: whereClause,
      });

      if (existingMovement) {
        throw new BadRequestException(
          'Ya existe un movimiento de inventario para esta venta y producto'
        );
      }
    }

    // Verificar duplicados por cambio
    if (data.changeId) {
      whereClause = {
        productId: data.productId,
        type: data.type,
        changeId: data.changeId,
      };
      
      const existingMovement = await prisma.inventoryMovement.findFirst({
        where: whereClause,
      });

      if (existingMovement) {
        throw new BadRequestException(
          'Ya existe un movimiento de inventario para este cambio y producto'
        );
      }
    }
  }

  /**
   * Calcula el stock actual de un producto
   */
  static async calculateCurrentStock(
    prisma: PrismaService,
    productId: number
  ): Promise<number> {
    const [entradas, salidas] = await Promise.all([
      prisma.inventoryMovement.aggregate({
        where: { productId, type: 'ENTRADA' },
        _sum: { quantity: true },
      }),
      prisma.inventoryMovement.aggregate({
        where: { productId, type: 'SALIDA' },
        _sum: { quantity: true },
      })
    ]);

    const totalEntradas = entradas._sum.quantity ?? 0;
    const totalSalidas = salidas._sum.quantity ?? 0;

    return totalEntradas - totalSalidas;
  }

  /**
   * Validación completa para crear un movimiento de inventario
   */
  static async validateCompleteMovement(
    prisma: PrismaService,
    data: CreateInventoryMovementInput
  ) {
    // 1. Validar datos básicos
    const inputValidation = this.validateCreateMovementInput(data);
    if (!inputValidation.isValid) {
      throw new BadRequestException(inputValidation.errors.join(', '));
    }

    // 2. Validar producto
    const productValidation = await this.validateProduct(prisma, data.productId);

    // 3. Validar estado del evento
    this.validateEventForMovement(productValidation.eventStatus!, data.type);

    // 4. Si es salida, validar stock
    if (data.type === 'SALIDA') {
      const stockValidation = await this.validateStock(prisma, data.productId, data.quantity);
      if (!stockValidation.hasEnoughStock) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${stockValidation.currentStock}, Solicitado: ${stockValidation.requestedQuantity}`
        );
      }
    }

    // 5. Validar venta si se proporciona
    let sale = null;
    if (data.saleId) {
      sale = await this.validateSale(prisma, data.saleId);
    }

    // 6. Validar cambio si se proporciona
    let change = null;
    if (data.changeId) {
      change = await this.validateChange(prisma, data.changeId);
    }

    // 7. Validar duplicados
    await this.validateNoDuplicateMovement(prisma, data);

    return {
      product: productValidation.product,
      sale,
      change
    };
  }

  /**
   * Valida fechas para filtros de búsqueda
   */
  static validateDateRange(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }
      
      // Validar que las fechas no sean futuras
      const now = new Date();
      if (start > now || end > now) {
        throw new BadRequestException('Las fechas no pueden ser futuras');
      }
    }
  }

  /**
   * Valida parámetros de paginación
   */
  static validatePagination(page: number, limit: number) {
    if (page < 1) {
      throw new BadRequestException('El número de página debe ser mayor a 0');
    }
    
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('El límite debe estar entre 1 y 100');
    }
  }
}
