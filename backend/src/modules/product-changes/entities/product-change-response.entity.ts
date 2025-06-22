import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Entity for Product Change API responses
 * Provides a clean, standardized response format
 */
export class ProductChangeResponseEntity {
  @ApiProperty({ 
    example: 1, 
    description: 'ID único del cambio de producto' 
  })
  id: number;

  @ApiProperty({ 
    example: 1, 
    description: 'ID de la venta original' 
  })
  saleId: number;

  @ApiProperty({ 
    example: 2, 
    description: 'ID del producto que se devolvió' 
  })
  productReturnedId: number;

  @ApiProperty({ 
    example: 3, 
    description: 'ID del producto que se entregó como cambio' 
  })
  productDeliveredId: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Cantidad de productos cambiados' 
  })
  quantity: number;

  @ApiProperty({ 
    example: 70.0, 
    description: 'Precio del producto entregado al momento del cambio' 
  })
  deliveredProductPrice: number;

  @ApiProperty({ 
    example: 20.0, 
    description: 'Diferencia de precio entre productos (siempre positiva)' 
  })
  valueDifference: number;

  @ApiPropertyOptional({
    example: 'CARD',
    enum: ['CASH', 'CARD'],
    description: 'Método de pago utilizado para cubrir la diferencia'
  })
  paymentMethodDifference?: string;

  @ApiPropertyOptional({
    example: 1.5,
    description: 'Fee de tarjeta aplicado a la diferencia'
  })
  cardFeeDifference?: number;

  @ApiProperty({ 
    example: '2025-06-22T10:30:00Z', 
    description: 'Fecha y hora de creación del cambio' 
  })
  createdAt: Date;

  constructor(partial: Partial<ProductChangeResponseEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Creates a ProductChangeResponseEntity from a Prisma ProductChange object
   */
  static fromPrisma(productChange: any): ProductChangeResponseEntity {
    return new ProductChangeResponseEntity({
      id: productChange.id,
      saleId: productChange.saleId,
      productReturnedId: productChange.productReturnedId,
      productDeliveredId: productChange.productDeliveredId,
      quantity: productChange.quantity,
      deliveredProductPrice: productChange.deliveredProductPrice,
      valueDifference: productChange.valueDifference,
      paymentMethodDifference: productChange.paymentMethodDifference,
      cardFeeDifference: productChange.cardFeeDifference,
      createdAt: productChange.createdAt,
    });
  }
}

/**
 * Entity for Product Change creation success response
 */
export class ProductChangeCreationResponseEntity {
  @ApiProperty({ 
    type: ProductChangeResponseEntity,
    description: 'Datos del cambio de producto creado' 
  })
  productChange: ProductChangeResponseEntity;

  @ApiProperty({ 
    example: 'Cambio registrado y movimientos de inventario creados exitosamente',
    description: 'Mensaje de confirmación' 
  })
  message: string;

  @ApiProperty({ 
    example: ['Movimiento de entrada creado', 'Movimiento de salida creado', 'Estado de venta actualizado'],
    description: 'Detalles de las operaciones realizadas' 
  })
  operations: string[];

  constructor(partial: Partial<ProductChangeCreationResponseEntity>) {
    Object.assign(this, partial);
  }
}

/**
 * Entity for Product Change detailed response (with relations)
 */
export class ProductChangeDetailedResponseEntity extends ProductChangeResponseEntity {
  @ApiProperty({ 
    description: 'Información de la venta original' 
  })
  sale?: {
    id: number;
    productName: string;
    quantitySold: number;
    valueCharged: number;
    artisanName: string;
    eventName: string;
  };

  @ApiProperty({ 
    description: 'Información del producto devuelto' 
  })
  returnedProduct?: {
    id: number;
    name: string;
    price: number;
    artisanName: string;
  };

  @ApiProperty({ 
    description: 'Información del producto entregado' 
  })
  deliveredProduct?: {
    id: number;
    name: string;
    price: number;
    artisanName: string;
  };

  constructor(partial: Partial<ProductChangeDetailedResponseEntity>) {
    super(partial);
    Object.assign(this, partial);
  }

  /**
   * Creates a detailed ProductChangeResponseEntity from a Prisma ProductChange with relations
   */
  static fromPrismaDetailed(productChange: any): ProductChangeDetailedResponseEntity {
    const base = ProductChangeResponseEntity.fromPrisma(productChange);
    
    return new ProductChangeDetailedResponseEntity({
      ...base,
      sale: productChange.sale ? {
        id: productChange.sale.id,
        productName: productChange.sale.product?.name,
        quantitySold: productChange.sale.quantitySold,
        valueCharged: productChange.sale.valueCharged,
        artisanName: productChange.sale.artisan?.name,
        eventName: productChange.sale.event?.name,
      } : undefined,
      returnedProduct: productChange.returnedProduct ? {
        id: productChange.returnedProduct.id,
        name: productChange.returnedProduct.name,
        price: productChange.returnedProduct.price,
        artisanName: productChange.returnedProduct.artisan?.name,
      } : undefined,
      deliveredProduct: productChange.deliveredProduct ? {
        id: productChange.deliveredProduct.id,
        name: productChange.deliveredProduct.name,
        price: productChange.deliveredProduct.price,
        artisanName: productChange.deliveredProduct.artisan?.name,
      } : undefined,
    });
  }
}

/**
 * Entity for paginated product changes list
 */
export class ProductChangeListResponseEntity {
  @ApiProperty({ 
    type: [ProductChangeResponseEntity],
    description: 'Lista de cambios de producto' 
  })
  data: ProductChangeResponseEntity[];

  @ApiProperty({ 
    example: { total: 50, page: 1, limit: 10, totalPages: 5 },
    description: 'Información de paginación' 
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  constructor(partial: Partial<ProductChangeListResponseEntity>) {
    Object.assign(this, partial);
  }
}
