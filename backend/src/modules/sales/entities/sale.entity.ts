import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Entidad Sale para respuestas de la API.
 * Representa la estructura de una venta en las respuestas.
 */
export class SaleEntity {
  @ApiProperty({ example: 1, description: 'ID único de la venta' })
  id: number;

  @ApiProperty({ example: 2, description: 'Cantidad de productos vendidos' })
  quantitySold: number;

  @ApiProperty({ example: 50000, description: 'Valor total cobrado por la venta' })
  valueCharged: number;

  @ApiProperty({ example: 'CASH', enum: ['CASH', 'CARD'], description: 'Método de pago utilizado' })
  paymentMethod: 'CASH' | 'CARD';

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'CANCELLED'], description: 'Estado de la venta' })
  state: 'ACTIVE' | 'CANCELLED';

  @ApiPropertyOptional({ example: 2500, description: 'Fee cobrado por uso de tarjeta' })
  cardFee?: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Fecha de la venta' })
  date: Date;

  @ApiProperty({ example: 1, description: 'ID del producto vendido' })
  productId: number;

  @ApiProperty({ example: 1, description: 'ID del evento' })
  eventId: number;

  @ApiProperty({ example: 1, description: 'ID del artesano' })
  artisanId: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Fecha de creación' })
  createdAt: Date;

  @ApiPropertyOptional({ example: 'VENTA', enum: ['VENTA', 'CAMBIO'], description: 'Tipo de transacción' })
  type?: 'VENTA' | 'CAMBIO';

  @ApiPropertyOptional({ example: 5000, description: 'Diferencia de valor en un cambio' })
  valueDifference?: number;

  /**
   * Crea una instancia de SaleEntity desde un objeto de Prisma.
   */
  static fromPrisma(sale: any): SaleEntity {
    const entity = new SaleEntity();
    entity.id = sale.id;
    entity.quantitySold = sale.quantitySold;
    entity.valueCharged = sale.valueCharged;
    entity.paymentMethod = sale.paymentMethod;
    entity.state = sale.state;
    entity.cardFee = sale.cardFee;
    entity.date = sale.date;
    entity.productId = sale.productId;
    entity.eventId = sale.eventId;
    entity.artisanId = sale.artisanId;
    entity.createdAt = sale.createdAt;
    entity.type = sale.type;
    entity.valueDifference = sale.valueDifference;
    return entity;
  }

  /**
   * Convierte una lista de objetos de Prisma a entidades.
   */
  static fromPrismaList(sales: any[]): SaleEntity[] {
    return sales.map(sale => SaleEntity.fromPrisma(sale));
  }
}

/**
 * Entidad Sale con información detallada incluyendo relaciones.
 * Usada cuando se necesita información del producto, artesano y evento.
 */
export class SaleWithDetailsEntity extends SaleEntity {
  @ApiProperty({
    description: 'Información del producto vendido',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'Artesanía Local' },
      price: { type: 'number', example: 25000 },
    }
  })
  product: {
    id: number;
    name: string;
    price: number;
  };

  @ApiProperty({
    description: 'Información del artesano',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'Juan Pérez' },
      identification: { type: 'string', example: '12345678' },
    }
  })
  artisan: {
    id: number;
    name: string;
    identification: string;
  };

  @ApiProperty({
    description: 'Información del evento',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'Feria Artesanal 2024' },
      location: { type: 'string', example: 'Plaza Principal' },
    }
  })
  event: {
    id: number;
    name: string;
    location: string;
  };

  /**
   * Crea una instancia desde un objeto de Prisma con relaciones.
   */
  static fromPrismaWithDetails(sale: any): SaleWithDetailsEntity {
    const entity = new SaleWithDetailsEntity();
    
    // Propiedades base de la venta
    Object.assign(entity, SaleEntity.fromPrisma(sale));
    
    // Relaciones
    entity.product = {
      id: sale.product?.id,
      name: sale.product?.name,
      price: sale.product?.price,
    };
    
    entity.artisan = {
      id: sale.artisan?.id,
      name: sale.artisan?.name,
      identification: sale.artisan?.identification,
    };
    
    entity.event = {
      id: sale.event?.id,
      name: sale.event?.name,
      location: sale.event?.location,
    };
    
    return entity;
  }
}

/**
 * Entidad para el resultado de una venta múltiple.
 */
export class MultiSaleResultEntity {
  @ApiProperty({ description: 'Información de la venta creada', type: SaleEntity })
  sale: SaleEntity;

  @ApiProperty({ example: 50000, description: 'Monto total de esta venta específica' })
  totalAmount: number;

  /**
   * Crea una instancia desde una venta y su monto total.
   */
  static fromSaleAndAmount(sale: SaleEntity, totalAmount: number): MultiSaleResultEntity {
    const entity = new MultiSaleResultEntity();
    entity.sale = sale;
    entity.totalAmount = totalAmount;
    return entity;
  }
}
