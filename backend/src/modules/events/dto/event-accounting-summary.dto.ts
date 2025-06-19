import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventArtisanSaleDetailDto {
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

  @ApiProperty()
  unitPrice: number; // <-- Agrega esto
}

export class EventArtisanAccountingSummaryDto {
  @ApiProperty()
  artisanId: number;

  @ApiProperty()
  artisanName: string;

  @ApiProperty()
  artisanIdentification: string; // <-- Agrega esto

  @ApiProperty({ type: [EventArtisanSaleDetailDto] })
  sales: EventArtisanSaleDetailDto[];

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

export class EventAccountingSummaryDto {
  @ApiProperty()
  eventId: number;

  @ApiProperty()
  eventName: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  commissionAssociationPercent: number;

  @ApiProperty()
  commissionSellerPercent: number;

  @ApiProperty({ type: [EventArtisanAccountingSummaryDto] })
  artisans: EventArtisanAccountingSummaryDto[];

  @ApiProperty()
  totalSold: number;

  @ApiProperty()
  totalCardFees: number;

  @ApiProperty()
  totalCommissionAssociation: number;

  @ApiProperty()
  totalCommissionSeller: number;

  @ApiProperty()
  totalNetReceived: number;
}