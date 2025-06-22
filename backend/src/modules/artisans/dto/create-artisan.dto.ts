import { createZodDto } from 'nestjs-zod';
import { CreateArtisanSchema } from '../schemas/create-artisan.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO unificado para crear artesanos.
 * Combina validación con Zod y documentación con Swagger.
 */
export class CreateArtisanDto extends createZodDto(CreateArtisanSchema) {
  @ApiProperty({
    example: 'Juana Pérez',
    description: 'Nombre completo del artesano',
  })
  name: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Número de identificación (solo números, 5-10 dígitos)',
  })
  identification: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Estado activo del artesano (por defecto: true)',
    default: true,
  })
  active: boolean;
}
