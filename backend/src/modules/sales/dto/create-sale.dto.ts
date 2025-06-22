import { createZodDto } from 'nestjs-zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSaleSchema } from '../schemas/create-sale.schema';

/**
 * DTO para crear una venta individual.
 * Combina validación con Zod y documentación con Swagger.
 */
export class CreateSaleDto extends createZodDto(CreateSaleSchema) {
  @ApiProperty({ 
    example: 1, 
    description: 'ID del evento al que pertenece la venta' 
  })
  eventId: number;

  @ApiProperty({ 
    example: 1, 
    description: 'ID del producto vendido' 
  })
  productId: number;

  @ApiProperty({ 
    example: 1, 
    description: 'ID del artesano que vendió el producto' 
  })
  artisanId: number;

  @ApiProperty({ 
    example: 2, 
    description: 'Cantidad de productos vendidos',
    minimum: 1
  })
  quantitySold: number;

  @ApiProperty({ 
    example: 50000, 
    description: 'Valor total cobrado por la venta',
    minimum: 0.01
  })
  valueCharged: number;

  @ApiProperty({ 
    example: 'CASH', 
    enum: ['CASH', 'CARD'],
    description: 'Método de pago utilizado' 
  })
  paymentMethod: 'CASH' | 'CARD';
  @ApiPropertyOptional({ 
    example: 2500, 
    description: 'Fee cobrado por uso de tarjeta (solo si paymentMethod es CARD)',
    minimum: 0
  })
  cardFee?: number;
}
