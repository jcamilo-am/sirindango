import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Helper para validaciones relacionadas con usuarios.
 * Centraliza todas las validaciones de negocio.
 */
export class UserValidationHelper {
  /**
   * Valida que el nombre de usuario sea único.
   */
  static async validateUniqueUsername(
    prisma: PrismaService, 
    username: string, 
    excludeId?: number
  ): Promise<void> {
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    if (existingUser) {
      throw new BadRequestException('Ya existe un usuario con ese nombre de usuario');
    }
  }

  /**
   * Valida que el usuario exista.
   */
  static async validateUserExists(prisma: PrismaService, id: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }

  /**
   * Valida que se pueda eliminar un usuario.
   * Por ahora solo verifica que existe, pero se puede extender con lógica adicional.
   */
  static async validateCanDelete(prisma: PrismaService, userId: number): Promise<void> {
    // Verificar que el usuario existe
    await this.validateUserExists(prisma, userId);

    // Aquí se pueden agregar validaciones adicionales, como:
    // - No permitir eliminar el último admin
    // - No permitir eliminar usuarios con datos relacionados
    // etc.
  }

  /**
   * Valida que un rol sea válido.
   */
  static validateRole(role: string): void {
    const validRoles = ['admin', 'user', 'manager']; // Definir roles válidos según el negocio
    
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Rol '${role}' no es válido. Roles válidos: ${validRoles.join(', ')}`);
    }
  }
}
