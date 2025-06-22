import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UserValidationHelper } from './helpers/user-validation.helper';
import { UserUtilsHelper } from './helpers/user-utils.helper';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo usuario con contraseña hasheada.
   */
  async create(data: CreateUserDto): Promise<UserEntity> {
    // Validar que el nombre de usuario sea único
    await UserValidationHelper.validateUniqueUsername(this.prisma, data.username);

    // Validar rol si se proporciona
    if (data.role) {
      UserValidationHelper.validateRole(data.role);
    }

    // Hashear la contraseña
    const hashedPassword = await UserUtilsHelper.hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: data.role || 'admin',
      },
    });

    return UserEntity.fromPrisma(user);
  }

  /**
   * Lista todos los usuarios.
   */
  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return UserEntity.fromPrismaList(users);
  }

  /**
   * Busca un usuario por ID.
   */
  async findOne(id: number): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return UserEntity.fromPrisma(user);
  }

  /**
   * Busca un usuario por nombre de usuario.
   * Incluye la contraseña para autenticación.
   */
  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Actualiza un usuario por ID.
   */
  async update(id: number, data: UpdateUserDto): Promise<UserEntity> {
    // Verificar que el usuario existe
    await UserValidationHelper.validateUserExists(this.prisma, id);

    // Validar unicidad del username si se está actualizando
    if (data.username) {
      await UserValidationHelper.validateUniqueUsername(this.prisma, data.username, id);
    }

    // Validar rol si se está actualizando
    if (data.role) {
      UserValidationHelper.validateRole(data.role);
    }

    const updateData: any = { ...data };

    // Hashear nueva contraseña si se proporciona
    if (data.password) {
      updateData.password = await UserUtilsHelper.hashPassword(data.password);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return UserEntity.fromPrisma(updatedUser);
  }

  /**
   * Elimina un usuario por ID.
   */
  async remove(id: number): Promise<UserEntity> {
    // Validar que se puede eliminar el usuario
    await UserValidationHelper.validateCanDelete(this.prisma, id);

    const deletedUser = await this.prisma.user.delete({
      where: { id },
    });

    return UserEntity.fromPrisma(deletedUser);
  }

  /**
   * Busca usuarios por rol.
   */
  async findByRole(role: string): Promise<UserEntity[]> {
    UserValidationHelper.validateRole(role);

    const users = await this.prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });

    return UserEntity.fromPrismaList(users);
  }

  /**
   * Verifica las credenciales de un usuario.
   */
  async validateCredentials(username: string, password: string): Promise<UserEntity | null> {
    const user = await this.findByUsername(username);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await UserUtilsHelper.comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    return UserEntity.fromPrisma(user);
  }
}
