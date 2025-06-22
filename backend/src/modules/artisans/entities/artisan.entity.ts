import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidad Artisan para respuestas de la API.
 * Representa la estructura de un artesano en las respuestas.
 */
export class ArtisanEntity {
  @ApiProperty({ example: 1, description: 'ID único del artesano' })
  id: number;

  @ApiProperty({
    example: 'Juana Pérez',
    description: 'Nombre completo del artesano',
  })
  name: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Número de identificación del artesano',
  })
  identification: string;

  @ApiProperty({
    example: true,
    description: 'Estado activo/inactivo del artesano',
  })
  active: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Fecha de creación',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Fecha de última actualización',
  })
  updatedAt: Date;
}

/**
 * Entidad Artisan con resumen de productos.
 * Usada cuando se necesita información de productos relacionados.
 */
export class ArtisanWithProductsEntity extends ArtisanEntity {
  @ApiProperty({
    description: 'Resumen de productos del artesano',
    type: 'object',
    properties: {
      totalProducts: { type: 'number', example: 5 },
      totalValue: { type: 'number', example: 150000 },
      averagePrice: { type: 'number', example: 30000 },
    },
  })
  productSummary: {
    totalProducts: number;
    totalValue: number;
    averagePrice: number;
  };
}
