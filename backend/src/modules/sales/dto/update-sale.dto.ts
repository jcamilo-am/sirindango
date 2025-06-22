import { createZodDto } from 'nestjs-zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateSaleSchema } from '../schemas/update-sale.schema';

/**
 * DTO para actualizar una venta.
 * Combina validación con Zod y documentación con Swagger.
 */
export class UpdateSaleDto extends createZodDto(UpdateSaleSchema) {
  @ApiPropertyOptional({ 
    example: 3, 
    description: 'Nueva cantidad de productos vendidos',
    minimum: 1
  })
  quantitySold?: number;

  @ApiPropertyOptional({ 
    example: 75000, 
    description: 'Nuevo valor total cobrado por la venta',
    minimum: 0.01
  })
  valueCharged?: number;

  @ApiPropertyOptional({ 
    example: 'CARD', 
    enum: ['CASH', 'CARD'],
    description: 'Nuevo método de pago' 
  })
  paymentMethod?: 'CASH' | 'CARD';

  @ApiPropertyOptional({ 
    example: 3500, 
    description: 'Nuevo fee cobrado por uso de tarjeta',
    minimum: 0
  })
  cardFee?: number;

  @ApiPropertyOptional({ 
    example: 'ACTIVE', 
    enum: ['ACTIVE', 'CANCELLED'],
    description: 'Nuevo estado de la venta'
  })
  state?: 'ACTIVE' | 'CANCELLED';

  @ApiPropertyOptional({ 
    example: 'CAMBIO', 
    enum: ['VENTA', 'CAMBIO'],
    description: 'Nuevo tipo de transacción'
  })
  type?: 'VENTA' | 'CAMBIO';

  @ApiPropertyOptional({ 
    example: 10000, 
    description: 'Nueva diferencia de valor en un cambio',
    minimum: 0
  })
  valueDifference?: number;
}
