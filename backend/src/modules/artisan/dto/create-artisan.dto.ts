import { createZodDto } from 'nestjs-zod';
import { CreateArtisanSchema } from '../schemas/create-artisan.schema';
import { ApiProperty } from '@nestjs/swagger';

// DTO para validación con Zod (solo para validación)
export class CreateArtisanDto extends createZodDto(CreateArtisanSchema) {}

// DTO para Swagger (solo para documentación)
export class CreateArtisanSwaggerDto {
  @ApiProperty({ example: 'Juana Pérez' })
  name: string;

  @ApiProperty({ example: '1234567890' })
  identification: string;

  @ApiProperty({ example: true })
  active: boolean;
}
