import { createZodDto } from 'nestjs-zod';
import { UpdateArtisanSchema } from '../schemas/update-artisan.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO unificado para actualizar artesanos.
 * Combina validación con Zod y documentación con Swagger.
 */
export class UpdateArtisanDto extends createZodDto(UpdateArtisanSchema) {
  @ApiPropertyOptional({
    example: 'Juana Actualizada',
    description: 'Nuevo nombre del artesano',
  })
  name?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Nueva identificación del artesano',
  })
  identification?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Nuevo estado activo del artesano',
  })
  active?: boolean;
}
