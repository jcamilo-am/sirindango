import { ApiProperty } from '@nestjs/swagger';

export class CreateMultiSaleItemDto {
  @ApiProperty()
  productId: number;

  @ApiProperty()
  artisanId: number;

  @ApiProperty()
  quantitySold: number;
}

export class CreateMultiSaleDto {
  @ApiProperty()
  eventId: number;

  @ApiProperty({ enum: ['CASH', 'CARD'] })
  paymentMethod: 'CASH' | 'CARD';

  @ApiProperty({ required: false, description: 'Fee total de datafono (solo si es tarjeta)' })
  cardFeeTotal?: number;

  @ApiProperty({ type: [CreateMultiSaleItemDto] })
  items: CreateMultiSaleItemDto[];
}