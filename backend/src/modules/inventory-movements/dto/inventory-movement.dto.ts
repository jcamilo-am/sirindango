import { createZodDto } from 'nestjs-zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateInventoryMovementSchema,
  GetInventoryMovementParamsSchema,
  InventoryMovementFiltersSchema,
  InventoryMovementStatsParamsSchema
} from '../schemas/inventory-movement.schemas';

// DTOs con validación Zod
export class CreateInventoryMovementDto extends createZodDto(CreateInventoryMovementSchema) {}
export class GetInventoryMovementParamsDto extends createZodDto(GetInventoryMovementParamsSchema) {}
export class InventoryMovementFiltersDto extends createZodDto(InventoryMovementFiltersSchema) {}
export class InventoryMovementStatsParamsDto extends createZodDto(InventoryMovementStatsParamsSchema) {}

// DTOs para documentación Swagger
export class CreateInventoryMovementSwaggerDto {
  @ApiProperty({ 
    example: 'ENTRADA', 
    enum: ['ENTRADA', 'SALIDA'],
    description: 'Tipo de movimiento de inventario'
  })
  type: 'ENTRADA' | 'SALIDA';

  @ApiProperty({ 
    example: 5,
    minimum: 1,
    description: 'Cantidad de productos en el movimiento'
  })
  quantity: number;

  @ApiPropertyOptional({ 
    example: 'Carga inicial de inventario',
    maxLength: 255,
    description: 'Razón o motivo del movimiento'
  })
  reason?: string;

  @ApiProperty({ 
    example: 1,
    description: 'ID del producto afectado'
  })
  productId: number;

  @ApiPropertyOptional({ 
    example: 2,
    description: 'ID de la venta asociada (si aplica)'
  })
  saleId?: number;

  @ApiPropertyOptional({ 
    example: 3,
    description: 'ID del cambio de producto asociado (si aplica)'
  })
  changeId?: number;
}

export class InventoryMovementResponseSwaggerDto extends CreateInventoryMovementSwaggerDto {
  @ApiProperty({ 
    example: 1,
    description: 'ID único del movimiento de inventario'
  })
  id: number;

  @ApiProperty({ 
    example: '2025-06-22T10:30:00Z',
    description: 'Fecha y hora de creación del movimiento'
  })
  createdAt: Date;
}

export class InventoryMovementFiltersSwaggerDto {
  @ApiPropertyOptional({ 
    example: 1,
    description: 'Filtrar por ID del producto'
  })
  productId?: number;

  @ApiPropertyOptional({ 
    example: 'ENTRADA',
    enum: ['ENTRADA', 'SALIDA'],
    description: 'Filtrar por tipo de movimiento'
  })
  type?: 'ENTRADA' | 'SALIDA';

  @ApiPropertyOptional({ 
    example: '2025-01-01T00:00:00Z',
    description: 'Fecha de inicio del filtro'
  })
  startDate?: string;

  @ApiPropertyOptional({ 
    example: '2025-12-31T23:59:59Z',
    description: 'Fecha de fin del filtro'
  })
  endDate?: string;

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
    description: 'Filtrar por ID de venta'
  })
  saleId?: number;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Filtrar por ID de cambio'
  })
  changeId?: number;

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

export class InventoryMovementStatsSwaggerDto {
  @ApiProperty({ 
    example: 25,
    description: 'Total de movimientos registrados'
  })
  totalMovements: number;

  @ApiProperty({ 
    example: 15,
    description: 'Total de movimientos de entrada'
  })
  totalEntradas: number;

  @ApiProperty({ 
    example: 10,
    description: 'Total de movimientos de salida'
  })
  totalSalidas: number;

  @ApiProperty({ 
    example: 50,
    description: 'Stock actual calculado'
  })
  currentStock: number;

  @ApiProperty({
    description: 'Movimientos agrupados por tipo',
    example: {
      entrada: { count: 15, totalQuantity: 100 },
      salida: { count: 10, totalQuantity: 50 }
    }
  })
  movementsByType: {
    entrada: { count: number; totalQuantity: number };
    salida: { count: number; totalQuantity: number };
  };
}
