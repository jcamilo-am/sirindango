import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Entity para respuestas de movimientos de inventario
 * Proporciona un formato de respuesta limpio y estandarizado
 */
export class InventoryMovementResponseEntity {
  @ApiProperty({ 
    example: 1,
    description: 'ID único del movimiento de inventario'
  })
  id: number;

  @ApiProperty({ 
    example: 'ENTRADA',
    enum: ['ENTRADA', 'SALIDA'],
    description: 'Tipo de movimiento'
  })
  type: 'ENTRADA' | 'SALIDA';

  @ApiProperty({ 
    example: 5,
    description: 'Cantidad de productos movidos'
  })
  quantity: number;

  @ApiPropertyOptional({ 
    example: 'Carga inicial de inventario',
    description: 'Razón del movimiento'
  })
  reason?: string;

  @ApiProperty({ 
    example: 1,
    description: 'ID del producto afectado'
  })
  productId: number;

  @ApiPropertyOptional({ 
    example: 2,
    description: 'ID de la venta asociada'
  })
  saleId?: number;

  @ApiPropertyOptional({ 
    example: 3,
    description: 'ID del cambio asociado'
  })
  changeId?: number;

  @ApiProperty({ 
    example: '2025-06-22T10:30:00Z',
    description: 'Fecha y hora de creación'
  })
  createdAt: Date;

  constructor(partial: Partial<InventoryMovementResponseEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Crea una entidad desde un objeto de Prisma
   */
  static fromPrisma(movement: any): InventoryMovementResponseEntity {
    return new InventoryMovementResponseEntity({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      productId: movement.productId,
      saleId: movement.saleId,
      changeId: movement.changeId,
      createdAt: movement.createdAt,
    });
  }
}

/**
 * Entity para movimientos de inventario con información detallada
 */
export class InventoryMovementDetailedResponseEntity extends InventoryMovementResponseEntity {
  @ApiProperty({
    description: 'Información del producto',
    example: { id: 1, name: 'Collar Artesanal', price: 15000 }
  })
  product?: {
    id: number;
    name: string;
    price: number;
    artisanName?: string;
    eventName?: string;
  };

  @ApiPropertyOptional({
    description: 'Información de la venta asociada',
    example: { id: 2, valueCharged: 15000, customerName: 'Juan Pérez' }
  })
  sale?: {
    id: number;
    valueCharged: number;
    customerName?: string;
    paymentMethod?: string;
  };

  @ApiPropertyOptional({
    description: 'Información del cambio asociado',
    example: { id: 3, valueDifference: 5000 }
  })
  change?: {
    id: number;
    valueDifference: number;
    productReturnedName?: string;
    productDeliveredName?: string;
  };

  constructor(partial: Partial<InventoryMovementDetailedResponseEntity>) {
    super(partial);
    Object.assign(this, partial);
  }
  /**
   * Crea una entidad detallada desde un objeto de Prisma con relaciones
   */
  static fromPrisma(movement: any): InventoryMovementDetailedResponseEntity {    
    return new InventoryMovementDetailedResponseEntity({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      productId: movement.productId,
      saleId: movement.saleId,
      changeId: movement.changeId,
      createdAt: movement.createdAt,
      product: movement.product ? {
        id: movement.product.id,
        name: movement.product.name,
        price: movement.product.price,
        artisanName: movement.product.artisan?.name,
        eventName: movement.product.event?.name,
      } : undefined,
      sale: movement.sale ? {
        id: movement.sale.id,
        valueCharged: movement.sale.valueCharged,
        customerName: movement.sale.customerName,
        paymentMethod: movement.sale.paymentMethod,
      } : undefined,
      change: movement.change ? {
        id: movement.change.id,
        valueDifference: movement.change.valueDifference,
        productReturnedName: movement.change.returnedProduct?.name,
        productDeliveredName: movement.change.deliveredProduct?.name,
      } : undefined,
    });
  }
}

/**
 * Entity para listas paginadas de movimientos
 */
export class InventoryMovementListResponseEntity {
  @ApiProperty({
    type: [InventoryMovementResponseEntity],
    description: 'Lista de movimientos de inventario'
  })
  data: InventoryMovementResponseEntity[];

  @ApiProperty({
    example: { total: 100, page: 1, limit: 10, totalPages: 10 },
    description: 'Información de paginación'
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  constructor(partial: Partial<InventoryMovementListResponseEntity>) {
    Object.assign(this, partial);
  }
}

/**
 * Entity para estadísticas de movimientos de inventario
 */
export class InventoryMovementStatsResponseEntity {
  @ApiProperty({ 
    example: 25,
    description: 'Total de movimientos registrados'
  })
  totalMovements: number;

  @ApiProperty({ 
    example: 15,
    description: 'Total de movimientos de entrada'
  })
  totalEntradas: number;

  @ApiProperty({ 
    example: 10,
    description: 'Total de movimientos de salida'
  })
  totalSalidas: number;

  @ApiProperty({ 
    example: 50,
    description: 'Stock actual calculado'
  })
  currentStock: number;

  @ApiProperty({
    description: 'Movimientos agrupados por tipo'
  })
  movementsByType: {
    entrada: { count: number; totalQuantity: number };
    salida: { count: number; totalQuantity: number };
  };

  @ApiProperty({
    description: 'Movimientos agrupados por razón',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
        count: { type: 'number' },
        totalQuantity: { type: 'number' }
      }
    }
  })
  movementsByReason: Array<{
    reason: string;
    count: number;
    totalQuantity: number;
  }>;

  @ApiPropertyOptional({
    description: 'Movimientos diarios (si se solicita)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        date: { type: 'string' },
        entradas: { type: 'number' },
        salidas: { type: 'number' },
        netChange: { type: 'number' }
      }
    }
  })
  dailyMovements?: Array<{
    date: string;
    entradas: number;
    salidas: number;
    netChange: number;
  }>;

  constructor(partial: Partial<InventoryMovementStatsResponseEntity>) {
    Object.assign(this, partial);
  }
}

/**
 * Entity para reportes de stock por producto
 */
export class ProductStockReportEntity {
  @ApiProperty({ 
    example: 1,
    description: 'ID del producto'
  })
  productId: number;

  @ApiProperty({ 
    example: 'Collar Artesanal',
    description: 'Nombre del producto'
  })
  productName: string;

  @ApiProperty({ 
    example: 50,
    description: 'Stock actual'
  })
  currentStock: number;

  @ApiProperty({ 
    example: 100,
    description: 'Total de entradas históricas'
  })
  totalEntradas: number;

  @ApiProperty({ 
    example: 50,
    description: 'Total de salidas históricas'
  })
  totalSalidas: number;

  @ApiPropertyOptional({ 
    example: '2025-06-22T10:30:00Z',
    description: 'Fecha del último movimiento'
  })
  lastMovementDate?: Date;

  @ApiProperty({
    description: 'Movimientos recientes',
    type: 'array'
  })
  recentMovements: Array<{
    id: number;
    type: 'ENTRADA' | 'SALIDA';
    quantity: number;
    reason?: string;
    createdAt: Date;
  }>;

  constructor(partial: Partial<ProductStockReportEntity>) {
    Object.assign(this, partial);
  }
}
