import { createZodDto } from 'nestjs-zod';
import { UpdateProductSchema } from '../schemas/update-product.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';

// DTO para validación con Zod (solo para validación)
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}

// DTO para Swagger (solo para documentación)
export class UpdateProductSwaggerDto {
  @ApiPropertyOptional({ example: 'Collar actualizado' })
  name?: string;

  @ApiPropertyOptional({ example: 30 })
  price?: number;

  @ApiPropertyOptional({ example: 5 })
  availableQuantity?: number;

  @ApiPropertyOptional({ example: 1 })
  eventId?: number;

  @ApiPropertyOptional({ example: 2 })
  artisanId?: number;

  @ApiPropertyOptional({ example: 'Bisutería' })
  category?: string;
}