import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;

  const mockUsersService = {
    findByUsername: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const user = {
        id: 1,
        username: 'admin',
        password: 'hashedPassword',
        role: 'admin',
      };

      mockUsersService.findByUsername.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser('admin', 'password123');

      expect(result).toEqual({
        id: 1,
        username: 'admin',
        role: 'admin',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const user = {
        id: 1,
        username: 'admin',
        password: 'hashedPassword',
        role: 'admin',
      };

      mockUsersService.findByUsername.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.validateUser('admin', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should use unified error message for security', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      try {
        await service.validateUser('nonexistent', 'password');
      } catch (error) {
        expect(error.message).toBe('Credenciales inválidas');
      }

      const user = {
        id: 1,
        username: 'admin',
        password: 'hashedPassword',
      };
      mockUsersService.findByUsername.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(false as never);

      try {
        await service.validateUser('admin', 'wrongpassword');
      } catch (error) {
        expect(error.message).toBe('Credenciales inválidas');
      }
    });
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      const loginDto = {
        username: 'admin',
        password: 'password123',
      };

      const user = {
        id: 1,
        username: 'admin',
        password: 'hashedPassword',
        role: 'admin',
      };

      const expectedUser = {
        id: 1,
        username: 'admin',
        role: 'admin',
      };

      mockUsersService.findByUsername.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'jwt-token-123',
        user: expectedUser,
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        username: 'admin',
        role: 'admin',
      });
    });

    it('should throw UnauthorizedException on invalid credentials during login', async () => {
      const loginDto = {
        username: 'admin',
        password: 'wrongpassword',
      };

      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should call validateUser with correct parameters', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'testpass',
      };

      const user = {
        id: 2,
        username: 'testuser',
        password: 'hashedPassword',
        role: 'user',
      };

      mockUsersService.findByUsername.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('test-token');

      await service.login(loginDto);

      expect(mockUsersService.findByUsername).toHaveBeenCalledWith('testuser');
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'testpass',
        'hashedPassword',
      );
    });

    it('should generate JWT with correct payload structure', async () => {
      const loginDto = {
        username: 'admin',
        password: 'password123',
      };

      const user = {
        id: 1,
        username: 'admin',
        password: 'hashedPassword',
        role: 'admin',
      };

      mockUsersService.findByUsername.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt-token');

      await service.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        username: 'admin',
        role: 'admin',
      });
    });
  });
});
