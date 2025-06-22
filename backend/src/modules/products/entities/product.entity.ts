import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidad Product para respuestas de la API.
 * Representa la estructura de un producto con su stock calculado.
 */
export class ProductEntity {
  @ApiProperty({ example: 1, description: 'ID único del producto' })
  id: number;

  @ApiProperty({
    example: 'Collar artesanal',
    description: 'Nombre del producto',
  })
  name: string;

  @ApiProperty({ example: 25.5, description: 'Precio del producto' })
  price: number;

  @ApiProperty({ example: 1, description: 'ID del evento al que pertenece' })
  eventId: number;

  @ApiProperty({ example: 2, description: 'ID del artesano que lo creó' })
  artisanId: number;

  @ApiProperty({
    example: 'Bisutería',
    description: 'Categoría del producto',
    required: false,
  })
  category?: string;

  @ApiProperty({ example: 10, description: 'Stock actual calculado' })
  stock: number;

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
 * Entidad Product con datos del evento incluidos.
 * Usada cuando se necesita información del evento relacionado.
 */
export class ProductWithEventEntity extends ProductEntity {
  @ApiProperty({
    description: 'Información del evento relacionado',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'Feria de Artesanías 2024' },
      state: { type: 'string', example: 'ACTIVE' },
    },
  })
  event: {
    id: number;
    name: string;
    state: string;
  };
}
