import { createZodDto } from 'nestjs-zod';
import { CreateInventoryMovementSchema } from '../schemas/create-inventory-movement.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO para validación con Zod
export class CreateInventoryMovementDto extends createZodDto(CreateInventoryMovementSchema) {}

// DTO para Swagger
export class CreateInventoryMovementSwaggerDto {
  @ApiProperty({ example: 'ENTRADA', enum: ['ENTRADA', 'SALIDA'] })
  type: 'ENTRADA' | 'SALIDA';

  @ApiProperty({ example: 5 })
  quantity: number;

  @ApiPropertyOptional({ example: 'Carga inicial' })
  reason?: string;

  @ApiProperty({ example: 1 })
  productId: number;

  @ApiPropertyOptional({ example: 2 })
  saleId?: number;

  @ApiPropertyOptional({ example: 3 })
  changeId?: number;
}
