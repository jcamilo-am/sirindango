import { createZodDto } from 'nestjs-zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  CreateMultiSaleSchema, 
  CreateMultiSaleItemSchema 
} from '../schemas/create-multi-sale.schema';

/**
 * DTO para un item de venta múltiple.
 * Combina validación con Zod y documentación con Swagger.
 */
export class CreateMultiSaleItemDto extends createZodDto(CreateMultiSaleItemSchema) {
  @ApiProperty({ 
    example: 1, 
    description: 'ID del producto a vender' 
  })
  productId: number;

  @ApiProperty({ 
    example: 1, 
    description: 'ID del artesano propietario del producto' 
  })
  artisanId: number;

  @ApiProperty({ 
    example: 2, 
    description: 'Cantidad del producto a vender',
    minimum: 1
  })
  quantitySold: number;
}

/**
 * DTO para crear múltiples ventas en una sola transacción.
 * Combina validación con Zod y documentación con Swagger.
 */
export class CreateMultiSaleDto extends createZodDto(CreateMultiSaleSchema) {
  @ApiProperty({ 
    example: 1, 
    description: 'ID del evento al que pertenecen todas las ventas' 
  })
  eventId: number;

  @ApiProperty({ 
    example: 'CASH', 
    enum: ['CASH', 'CARD'],
    description: 'Método de pago para todas las ventas' 
  })
  paymentMethod: 'CASH' | 'CARD';

  @ApiPropertyOptional({
    example: 5000,
    description: 'Fee total del datafono (solo si es tarjeta). Se prorratea entre los productos',
    minimum: 0,
    default: 0
  })
  cardFeeTotal: number;

  @ApiProperty({ 
    type: [CreateMultiSaleItemDto],
    description: 'Lista de productos a vender',
    minItems: 1,
    maxItems: 50
  })
  items: CreateMultiSaleItemDto[];
}
