import { createZodDto } from 'nestjs-zod';
import { UpdateEventSchema } from '../schemas/update-event.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO unificado para actualizar eventos.
 * Combina validación con Zod y documentación con Swagger.
 */
export class UpdateEventDto extends createZodDto(UpdateEventSchema) {
  @ApiPropertyOptional({
    example: 'Feria Artesanal 2025 - Actualizada',
    description: 'Nombre del evento',
    minLength: 1,
    maxLength: 100,
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'Plaza Nueva, Medellín',
    description: 'Ubicación donde se realizará el evento',
    minLength: 1,
    maxLength: 200,
  })
  location?: string;

  @ApiPropertyOptional({
    example: '2025-07-02T10:00:00.000Z',
    description: 'Fecha y hora de inicio del evento',
    type: 'string',
    format: 'date-time',
  })
  startDate?: Date;

  @ApiPropertyOptional({
    example: '2025-07-06T18:00:00.000Z',
    description: 'Fecha y hora de finalización del evento',
    type: 'string',
    format: 'date-time',
  })
  endDate?: Date;

  @ApiPropertyOptional({
    example: 12,
    description: 'Porcentaje de comisión para la asociación (0-100)',
    minimum: 0,
    maximum: 100,
  })
  commissionAssociation?: number;

  @ApiPropertyOptional({
    example: 6,
    description: 'Porcentaje de comisión para el vendedor (0-100)',
    minimum: 0,
    maximum: 100,
  })
  commissionSeller?: number;
}
