import { createZodDto } from 'nestjs-zod';
import { CreateSaleSchema } from '../schemas/create-sale.schema';
import { ApiProperty } from '@nestjs/swagger';

// DTO para validación con Zod (solo para validación)
export class CreateSaleDto extends createZodDto(CreateSaleSchema) {}

// DTO para Swagger (solo para documentación)
export class CreateSaleSwaggerDto {
  @ApiProperty({ example: 1 })
  eventId: number;

  @ApiProperty({ example: 2 })
  productId: number;

  @ApiProperty({ example: 3 })
  artisanId: number;

  @ApiProperty({ example: 5 })
  quantitySold: number;
}