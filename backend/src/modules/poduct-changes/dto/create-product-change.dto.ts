import { createZodDto } from 'nestjs-zod';
import { CreateProductChangeSchema } from '../schemas/create-product-change.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO para validación con Zod
export class CreateProductChangeDto extends createZodDto(CreateProductChangeSchema) {}

// DTO para Swagger
export class CreateProductChangeSwaggerDto {
  @ApiProperty({ example: 1 })
  saleId: number;

  @ApiProperty({ example: 2 })
  productReturnedId: number;

  @ApiProperty({ example: 3 })
  productDeliveredId: number;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 70, description: 'Precio unitario del producto entregado en el momento del cambio' })
  deliveredProductPrice: number;

  @ApiProperty({ example: 20, description: 'Excedente pagado por el cliente (puede ser 0)' })
  valueDifference: number;

  @ApiPropertyOptional({ example: 'CARD', enum: ['CASH', 'CARD'], description: 'Método de pago del excedente' })
  paymentMethodDifference?: 'CASH' | 'CARD';

  @ApiPropertyOptional({ example: 1.5, description: 'Fee de datafono sobre el excedente (si aplica)' })
  cardFeeDifference?: number;
}