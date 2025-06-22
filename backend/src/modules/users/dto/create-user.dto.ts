import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserSchema } from '../schemas/create-user.schema';

/**
 * DTO para crear un usuario.
 * Combina validación con Zod y documentación con Swagger.
 */
export class CreateUserDto extends createZodDto(CreateUserSchema) {
  @ApiProperty({ 
    example: 'john_doe', 
    description: 'Nombre de usuario único',
    minLength: 3
  })
  username: string;

  @ApiProperty({ 
    example: 'password123', 
    description: 'Contraseña del usuario',
    minLength: 6
  })
  password: string;

  @ApiProperty({ 
    example: 'admin', 
    description: 'Rol del usuario en el sistema',
    default: 'admin'
  })
  role?: string;
}
