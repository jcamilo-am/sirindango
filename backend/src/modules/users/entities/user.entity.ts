import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidad User para respuestas de la API.
 * Representa la estructura de un usuario en las respuestas (sin contraseña).
 */
export class UserEntity {
  @ApiProperty({ example: 1, description: 'ID único del usuario' })
  id: number;

  @ApiProperty({ example: 'john_doe', description: 'Nombre de usuario único' })
  username: string;

  @ApiProperty({ example: 'admin', description: 'Rol del usuario en el sistema' })
  role: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Fecha de creación del usuario' })
  createdAt: Date;

  /**
   * Crea una instancia de UserEntity desde un objeto de Prisma.
   * Excluye la contraseña por seguridad.
   */
  static fromPrisma(user: any): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.username = user.username;
    entity.role = user.role;
    entity.createdAt = user.createdAt;
    return entity;
  }

  /**
   * Convierte una lista de objetos de Prisma a entidades.
   */
  static fromPrismaList(users: any[]): UserEntity[] {
    return users.map(user => UserEntity.fromPrisma(user));
  }
}
