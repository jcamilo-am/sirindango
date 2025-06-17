import { createZodDto } from 'nestjs-zod';
import { UpdateSaleSchema } from '../schemas/update-sale.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';

// DTO para validación con Zod (solo para validación)
export class UpdateSaleDto extends createZodDto(UpdateSaleSchema) {}

// DTO para Swagger (solo para documentación)
export class UpdateSaleSwaggerDto {
  @ApiPropertyOptional({ example: 1 })
  eventId?: number;

  @ApiPropertyOptional({ example: 2 })
  productId?: number;

  @ApiPropertyOptional({ example: 3 })
  artisanId?: number;

  @ApiPropertyOptional({ example: 5 })
  quantitySold?: number;
}