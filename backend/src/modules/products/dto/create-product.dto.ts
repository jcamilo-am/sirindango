import { createZodDto } from 'nestjs-zod';
import { CreateProductSchema } from '../schemas/create-product.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO unificado para crear productos.
 * Combina validación con Zod y documentación con Swagger.
 */
export class CreateProductDto extends createZodDto(CreateProductSchema) {
  @ApiProperty({
    example: 'Collar artesanal',
    description: 'Nombre del producto',
  })
  name: string;

  @ApiProperty({
    example: 25.5,
    description: 'Precio del producto',
  })
  price: number;

  @ApiProperty({
    example: 10,
    description: 'Cantidad inicial para el inventario',
  })
  initialQuantity: number;

  @ApiProperty({
    example: 1,
    description: 'ID del evento al que pertenece el producto',
  })
  eventId: number;

  @ApiProperty({
    example: 2,
    description: 'ID del artesano que crea el producto',
  })
  artisanId: number;

  @ApiPropertyOptional({
    example: 'Bisutería',
    description: 'Categoría del producto (opcional)',
  })
  category?: string;
}
