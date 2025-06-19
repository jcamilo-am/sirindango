import { createZodDto } from 'nestjs-zod';
import { CreateEventSchema } from '../schemas/create-event.schema';
import { ApiProperty } from '@nestjs/swagger';

// DTO para validación con Zod (solo para validación)
export class CreateEventDto extends createZodDto(CreateEventSchema) {}

// DTO para Swagger (solo para documentación)
export class CreateEventSwaggerDto {
  @ApiProperty({ example: 'Feria Artesanal' })
  name: string;

  @ApiProperty({ example: 'Plaza Central' })
  location: string;

  @ApiProperty({ example: '2025-07-01T10:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2025-07-05T18:00:00.000Z' })
  endDate: Date;

  @ApiProperty({ example: 10, description: 'Porcentaje comisión asociación' })
  commissionAssociation: number;

  @ApiProperty({ example: 5, description: 'Porcentaje comisión vendedor' })
  commissionSeller: number;
}
