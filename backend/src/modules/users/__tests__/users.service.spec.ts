import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserUtilsHelper } from '../helpers/user-utils.helper';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrisma = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  // Mock para bcrypt
  jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn().mockResolvedValue(true),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createData: CreateUserDto = {
        username: 'testuser',
        password: 'password123',
        role: 'admin',
      };

      const createdUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        role: 'admin',
        createdAt: new Date(),
      };

      // Mock para verificar unicidad
      mockPrisma.user.findFirst.mockResolvedValue(null);
      
      // Mock para crear usuario
      mockPrisma.user.create.mockResolvedValue(createdUser);

      // Mock para hashear contraseña
      jest.spyOn(UserUtilsHelper, 'hashPassword').mockResolvedValue('hashedPassword');

      const result = await service.create(createData);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });

      expect(UserUtilsHelper.hashPassword).toHaveBeenCalledWith('password123');

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          password: 'hashedPassword',
          role: 'admin',
        },
      });

      expect(result).toEqual(expect.objectContaining({
        id: 1,
        username: 'testuser',
        role: 'admin',
        createdAt: expect.any(Date),
      }));
      // Verificar que no se incluya la contraseña en la respuesta
      expect(result).not.toHaveProperty('password');
    });

    it('should throw BadRequestException when username already exists', async () => {
      const createData: CreateUserDto = {
        username: 'existinguser',
        password: 'password123',
        role: 'admin',
      };

      // Mock para simular usuario existente
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        username: 'existinguser',
      });

      await expect(service.create(createData)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should use default role when not provided', async () => {
      const createData: CreateUserDto = {
        username: 'testuser',
        password: 'password123',
      };

      const createdUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        role: 'admin',
        createdAt: new Date(),
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUser);
      jest.spyOn(UserUtilsHelper, 'hashPassword').mockResolvedValue('hashedPassword');

      await service.create(createData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          password: 'hashedPassword',
          role: 'admin',
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          username: 'user1',
          password: 'hashedPassword1',
          role: 'admin',
          createdAt: new Date(),
        },
        {
          id: 2,
          username: 'user2',
          password: 'hashedPassword2',
          role: 'user',
          createdAt: new Date(),
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('should find user by id', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        role: 'admin',
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(result).toEqual(expect.objectContaining({
        id: 1,
        username: 'testuser',
        role: 'admin',
        createdAt: expect.any(Date),
      }));
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUsername', () => {
    it('should find user by username including password', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        role: 'admin',
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findByUsername('testuser');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });

      expect(result).toEqual(user);
      // En este caso sí debe incluir la contraseña para autenticación
      expect(result).toHaveProperty('password');
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updateData: UpdateUserDto = {
        username: 'updateduser',
        role: 'user',
      };

      const existingUser = {
        id: 1,
        username: 'olduser',
        password: 'hashedPassword',
        role: 'admin',
        createdAt: new Date(),
      };

      const updatedUser = {
        ...existingUser,
        ...updateData,
      };

      // Mock para validar que existe
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      
      // Mock para verificar unicidad del nuevo username
      mockPrisma.user.findFirst.mockResolvedValue(null);
      
      // Mock para actualización
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });

      expect(result).toEqual(expect.objectContaining({
        id: 1,
        username: 'updateduser',
        role: 'user',
      }));
      expect(result).not.toHaveProperty('password');
    });

    it('should hash password when updating password', async () => {
      const updateData: UpdateUserDto = {
        password: 'newpassword123',
      };

      const existingUser = {
        id: 1,
        username: 'testuser',
        password: 'oldHashedPassword',
        role: 'admin',
        createdAt: new Date(),
      };

      const updatedUser = {
        ...existingUser,
        password: 'newHashedPassword',
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);
      jest.spyOn(UserUtilsHelper, 'hashPassword').mockResolvedValue('newHashedPassword');

      await service.update(1, updateData);

      expect(UserUtilsHelper.hashPassword).toHaveBeenCalledWith('newpassword123');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: 'newHashedPassword' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      const updateData: UpdateUserDto = {
        username: 'updateduser',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateData)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        role: 'admin',
        createdAt: new Date(),
      };

      // Mock para validar que existe
      mockPrisma.user.findUnique.mockResolvedValue(user);
      
      // Mock para eliminación
      mockPrisma.user.delete.mockResolvedValue(user);

      const result = await service.remove(1);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(result).toEqual(expect.objectContaining({
        id: 1,
        username: 'testuser',
        role: 'admin',
      }));
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const users = [
        {
          id: 1,
          username: 'admin1',
          password: 'hashedPassword1',
          role: 'admin',
          createdAt: new Date(),
        },
        {
          id: 2,
          username: 'admin2',
          password: 'hashedPassword2',
          role: 'admin',
          createdAt: new Date(),
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await service.findByRole('admin');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'admin' },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('password');
    });
  });

  describe('validateCredentials', () => {
    it('should return user when credentials are valid', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        role: 'admin',
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      jest.spyOn(UserUtilsHelper, 'comparePassword').mockResolvedValue(true);

      const result = await service.validateCredentials('testuser', 'password123');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });

      expect(UserUtilsHelper.comparePassword).toHaveBeenCalledWith('password123', 'hashedPassword');

      expect(result).toEqual(expect.objectContaining({
        id: 1,
        username: 'testuser',
        role: 'admin',
      }));
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateCredentials('nonexistent', 'password123');

      expect(result).toBeNull();
      expect(UserUtilsHelper.comparePassword).not.toHaveBeenCalled();
    });

    it('should return null when password is invalid', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        role: 'admin',
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      jest.spyOn(UserUtilsHelper, 'comparePassword').mockResolvedValue(false);

      const result = await service.validateCredentials('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });
});
