import { createZodDto } from 'nestjs-zod';
import { UpdateArtisanSchema } from '../schemas/update-artisan.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';

// DTO para validación con Zod (solo para validación)
export class UpdateArtisanDto extends createZodDto(UpdateArtisanSchema) {}

// DTO para Swagger (solo para documentación)
export class UpdateArtisanSwaggerDto {
  @ApiPropertyOptional({ example: 'Juana Actualizada' })
  name?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  identification?: string;

  @ApiPropertyOptional({ example: true })
  active?: boolean;
}