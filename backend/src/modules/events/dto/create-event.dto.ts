import { createZodDto } from 'nestjs-zod';
import { CreateEventSchema } from '../schemas/create-event.schema';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO unificado para crear eventos.
 * Combina validación con Zod y documentación con Swagger.
 */
export class CreateEventDto extends createZodDto(CreateEventSchema) {
  @ApiProperty({
    example: 'Feria Artesanal 2025',
    description: 'Nombre del evento',
    minLength: 1,
    maxLength: 100,
  })
  name: string;

  @ApiProperty({
    example: 'Plaza Central, Bogotá',
    description: 'Ubicación donde se realizará el evento',
    minLength: 1,
    maxLength: 200,
  })
  location: string;

  @ApiProperty({
    example: '2025-07-01T10:00:00.000Z',
    description: 'Fecha y hora de inicio del evento',
    type: 'string',
    format: 'date-time',
  })
  startDate: Date;

  @ApiProperty({
    example: '2025-07-05T18:00:00.000Z',
    description: 'Fecha y hora de finalización del evento',
    type: 'string',
    format: 'date-time',
  })
  endDate: Date;

  @ApiProperty({
    example: 10,
    description: 'Porcentaje de comisión para la asociación (0-100)',
    minimum: 0,
    maximum: 100,
    default: 10,
  })
  commissionAssociation: number;

  @ApiProperty({
    example: 5,
    description: 'Porcentaje de comisión para el vendedor (0-100)',
    minimum: 0,
    maximum: 100,
    default: 5,
  })
  commissionSeller: number;
}
