import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';
import { LoginSchema } from '../schemas/auth.schema';

// Dto para validaciones con Zod (solo para validaciónes)
export class LoginDto extends createZodDto(LoginSchema) {}

// Dto para Swagger (solo para documentación)
export class LoginSwaggerDto {
  @ApiProperty({ example: 'admin' })
  username: string;

  @ApiProperty({ example: 'password123' })
  password: string;
}
