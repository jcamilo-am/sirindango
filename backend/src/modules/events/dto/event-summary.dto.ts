import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO para Swagger (solo para documentación)
export class ProductSummarySwaggerDto {
  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: 'Collar artesanal' })
  name: string;

  @ApiPropertyOptional({ example: 5, description: 'Solo para productos no vendidos' })
  availableQuantity?: number;

  @ApiPropertyOptional({ example: 10, description: 'Solo para resumen general de productos' })
  quantitySold?: number;
}

export class EventSummarySwaggerDto {
  @ApiProperty({ example: 2 })
  artisanId: number;

  @ApiProperty({ example: 'Juana Pérez' })
  artisanName: string;

  @ApiProperty({ example: 3 })
  totalRegisteredProducts: number;

  @ApiProperty({ example: 15 })
  totalSoldProducts: number;

  @ApiProperty({ example: 250.5 })
  totalRevenue: number;

  @ApiProperty({ type: [ProductSummarySwaggerDto] })
  unsoldProducts: ProductSummarySwaggerDto[];

  @ApiProperty({ type: [ProductSummarySwaggerDto] })
  generalProductSummary: ProductSummarySwaggerDto[];
}

// DTOs originales para lógica interna (Servicio)
export class ProductSummaryDto {
  productId: number;
  name: string;
  availableQuantity?: number;
  quantitySold?: number;
}

export class EventSummaryDto {
  artisanId: number;
  artisanName: string;
  totalRegisteredProducts: number;
  totalSoldProducts: number;
  totalRevenue: number;
  unsoldProducts: ProductSummaryDto[];
  generalProductSummary: ProductSummaryDto[];
}