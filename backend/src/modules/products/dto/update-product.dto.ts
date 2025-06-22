import { createZodDto } from 'nestjs-zod';
import { UpdateProductSchema } from '../schemas/update-product.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO unificado para actualizar productos.
 * Combina validación con Zod y documentación con Swagger.
 */
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {
  @ApiPropertyOptional({
    example: 'Collar actualizado',
    description: 'Nuevo nombre del producto',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Nuevo precio del producto',
  })
  price?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Nuevo ID del evento',
  })
  eventId?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Nuevo ID del artesano',
  })
  artisanId?: number;

  @ApiPropertyOptional({
    example: 'Joyería',
    description: 'Nueva categoría del producto',
  })
  category?: string;
}
