import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ArtisanProductSummarySwaggerDto {
  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: 'Collar artesanal' })
  name: string;

  @ApiProperty({ example: 10 })
  price: number;

  @ApiPropertyOptional({ example: 5, description: 'Stock actual' })
  stock?: number;

  @ApiPropertyOptional({ example: 3, description: 'Cantidad vendida' })
  quantitySold?: number;
}

export class ArtisanSaleChangeSummarySwaggerDto {
  @ApiProperty({ example: 1 })
  saleId: number;

  @ApiProperty({ example: 2 })
  productReturnedId: number;

  @ApiProperty({ example: 3 })
  productDeliveredId: number;

  @ApiProperty({ example: 1 })
  quantity: number;
}

export class ArtisanSummarySwaggerDto {
  @ApiProperty({ example: 1 })
  artisanId: number;

  @ApiProperty({ example: 'Juana Pérez' })
  artisanName: string;

  @ApiProperty({ example: 1000 })
  totalSold: number;

  @ApiProperty({ example: 100 })
  commission: number;

  @ApiProperty({ type: [ArtisanProductSummarySwaggerDto] })
  soldProducts: ArtisanProductSummarySwaggerDto[];

  @ApiProperty({ type: [ArtisanProductSummarySwaggerDto] })
  unsoldProducts: ArtisanProductSummarySwaggerDto[];

  @ApiProperty({ type: [ArtisanSaleChangeSummarySwaggerDto] })
  changes: ArtisanSaleChangeSummarySwaggerDto[];

  @ApiProperty()
  commissionAssociation: number;

  @ApiProperty()
  commissionSeller: number;
}

export class ArtisanSaleDetailDto {
  @ApiProperty()
  saleId: number;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  productId: number;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  quantitySold: number;

  @ApiProperty()
  valueCharged: number;

  @ApiPropertyOptional({ enum: ['CASH', 'CARD'] })
  paymentMethod?: 'CASH' | 'CARD';

  @ApiPropertyOptional()
  cardFee?: number;

  @ApiProperty({ example: 'VENTA', enum: ['VENTA', 'CAMBIO'] })
  type: 'VENTA' | 'CAMBIO';

  @ApiPropertyOptional({ example: 0, description: 'Excedente pagado en el cambio (solo para cambios)' })
  valueDifference?: number;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'CANCELLED', 'CHANGED'] })
  state: 'ACTIVE' | 'CANCELLED' | 'CHANGED';
}

export class ArtisanSummaryContableDto {
  @ApiProperty({ type: [ArtisanSaleDetailDto] })
  sales: ArtisanSaleDetailDto[];

  @ApiProperty()
  totalSold: number;

  @ApiProperty()
  totalCardFees: number;

  @ApiProperty()
  commissionAssociation: number;

  @ApiProperty()
  commissionSeller: number;

  @ApiProperty()
  netReceived: number;
}