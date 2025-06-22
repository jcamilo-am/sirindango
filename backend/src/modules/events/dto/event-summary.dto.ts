import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO para Swagger (solo para documentación)
export class ProductSummarySwaggerDto {
  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: 'Collar artesanal' })
  name: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Solo para productos no vendidos',
  })
  availableQuantity?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Solo para resumen general de productos',
  })
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

export class PaymentTotalsDto {
  @ApiProperty({ example: 15000 })
  CASH: number;

  @ApiProperty({ example: 8000 })
  CARD: number;
}

export class MostSoldProductDto {
  @ApiProperty({ example: 5 })
  productId: number;

  @ApiProperty({ example: 'Collar artesanal' })
  name: string;

  @ApiProperty({ example: 20 })
  quantitySold: number;
}

export class TopArtisanDto {
  @ApiProperty({ example: 2 })
  artisanId: number;

  @ApiProperty({ example: 'Juana Pérez' })
  name: string;

  @ApiProperty({ example: 8000 })
  totalSold: number;
}

export class EventSummaryDto {
  @ApiProperty({ example: 1 })
  eventId: number;

  @ApiProperty({ example: 'Feria Artesanal' })
  eventName: string;

  @ApiProperty({ example: 23000 })
  totalSales: number;

  @ApiProperty({ type: PaymentTotalsDto })
  paymentTotals: PaymentTotalsDto;

  @ApiProperty({
    example: 2300,
    description: 'Total comisión para la asociación',
  })
  associationCommission: number;

  @ApiProperty({
    example: 1150,
    description: 'Total comisión para el vendedor',
  })
  sellerCommission: number;

  @ApiProperty({ example: 19550, description: 'Total neto para artesanos' })
  netForArtisans: number;

  @ApiProperty({ type: MostSoldProductDto, nullable: true })
  mostSoldProduct: MostSoldProductDto | null;

  @ApiProperty({ type: TopArtisanDto, nullable: true })
  topArtisan: TopArtisanDto | null;

  @ApiProperty({
    example: 400,
    description: 'Total descontado por datafono en ventas con tarjeta',
  })
  cardFeesTotal: number;
}
