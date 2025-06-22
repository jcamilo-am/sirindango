import { createZodDto } from 'nestjs-zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  CreateProductChangeSchema,
  GetProductChangeParamsSchema,
  ListProductChangesQuerySchema
} from '../schemas/product-change.schemas';

// DTO for creating product changes (Zod validation)
export class CreateProductChangeDto extends createZodDto(CreateProductChangeSchema) {}

// DTO for getting product change by ID (Zod validation)
export class GetProductChangeParamsDto extends createZodDto(GetProductChangeParamsSchema) {}

// DTO for listing product changes with filters (Zod validation)
export class ListProductChangesQueryDto extends createZodDto(ListProductChangesQuerySchema) {}

// Swagger DTOs for API documentation
export class CreateProductChangeSwaggerDto {
  @ApiProperty({ 
    example: 1, 
    description: 'ID de la venta original' 
  })
  saleId: number;

  @ApiProperty({ 
    example: 2, 
    description: 'ID del producto que se devuelve' 
  })
  productReturnedId: number;

  @ApiProperty({ 
    example: 3, 
    description: 'ID del producto que se entrega como cambio' 
  })
  productDeliveredId: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Cantidad de productos a cambiar' 
  })
  quantity: number;

  @ApiPropertyOptional({
    example: 'CARD',
    enum: ['CASH', 'CARD'],
    description: 'Método de pago para la diferencia de precio'
  })
  paymentMethodDifference?: 'CASH' | 'CARD';

  @ApiPropertyOptional({
    example: 1.5,
    description: 'Fee de tarjeta aplicado a la diferencia (solo si es CARD)'
  })
  cardFeeDifference?: number;
}

export class ProductChangeResponseSwaggerDto extends CreateProductChangeSwaggerDto {
  @ApiProperty({ 
    example: 1, 
    description: 'ID único del cambio de producto' 
  })
  id: number;

  @ApiProperty({ 
    example: 70.0, 
    description: 'Precio del producto entregado al momento del cambio' 
  })
  deliveredProductPrice: number;

  @ApiProperty({ 
    example: 20.0, 
    description: 'Diferencia de precio entre productos' 
  })
  valueDifference: number;

  @ApiProperty({ 
    example: '2025-06-22T10:30:00Z', 
    description: 'Fecha y hora de creación del cambio' 
  })
  createdAt: Date;
}

export class ListProductChangesQuerySwaggerDto {
  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Filtrar por ID del evento' 
  })
  eventId?: number;

  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Filtrar por ID del artesano' 
  })
  artisanId?: number;

  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Filtrar por ID de la venta' 
  })
  saleId?: number;

  @ApiPropertyOptional({ 
    example: 1, 
    minimum: 1,
    description: 'Número de página' 
  })
  page?: number;

  @ApiPropertyOptional({ 
    example: 10, 
    minimum: 1,
    maximum: 100,
    description: 'Cantidad de resultados por página' 
  })
  limit?: number;
}
