import { createZodDto } from 'nestjs-zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateUserSchema } from '../schemas/update-user.schema';

/**
 * DTO para actualizar un usuario.
 * Combina validación con Zod y documentación con Swagger.
 */
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {
  @ApiPropertyOptional({ 
    example: 'john_doe_updated', 
    description: 'Nombre de usuario único',
    minLength: 3
  })
  username?: string;

  @ApiPropertyOptional({ 
    example: 'newpassword123', 
    description: 'Nueva contraseña del usuario',
    minLength: 6
  })
  password?: string;

  @ApiPropertyOptional({ 
    example: 'user', 
    description: 'Rol del usuario en el sistema'
  })
  role?: string;
}
