import { createZodDto } from 'nestjs-zod';
import { CreateProductSchema } from '../schemas/create-product.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO para validación con Zod (solo para validación)
export class CreateProductDto extends createZodDto(CreateProductSchema) {}

// DTO para Swagger (solo para documentación)
export class CreateProductSwaggerDto {
  @ApiProperty({ example: 'Collar artesanal' })
  name: string;

  @ApiProperty({ example: 25.5 })
  price: number;

  @ApiProperty({ example: 10 })
  initialQuantity: number;

  @ApiProperty({ example: 1 })
  eventId: number;

  @ApiProperty({ example: 2 })
  artisanId: number;

  @ApiPropertyOptional({ example: 'Bisutería' })
  category?: string;

  @ApiProperty({ example: 10, description: 'Stock actual calculado en base a movimientos' })
  stock: number;
}