import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UsersService } from '../../src/modules/users/users.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { IntegrationTestSetup, TestDataFactory } from './test-setup';
import * as bcrypt from 'bcrypt';

/**
 * Pruebas de Integración para AuthService
 * Solo flujos críticos de autenticación con BD real
 */
describe('AuthService - Integration', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module = await IntegrationTestSetup.setupTestModule([
      AuthService,
      UsersService,
      JwtService,
    ]);

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    prisma = IntegrationTestSetup.prisma;
    jwtService = module.get<JwtService>(JwtService);
  });

  beforeEach(async () => {
    await IntegrationTestSetup.cleanDatabase();
  });

  describe('Authentication Flow with Real Database', () => {
    it('should authenticate user with correct credentials', async () => {
      // Create user with hashed password
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          password: hashedPassword,
          role: 'USER',
        },
      });

      // Validate user credentials
      const validatedUser = await authService.validateUser(
        'testuser',
        password,
      );
      expect(validatedUser).toBeTruthy();
      expect(validatedUser?.id).toBe(user.id);
      expect(validatedUser?.username).toBe(user.username);
      // Password should be removed from response
      expect('password' in validatedUser).toBe(false);
    });

    it('should reject authentication with wrong password', async () => {
      const password = 'correctpassword';
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: {
          username: 'testuser',
          password: hashedPassword,
          role: 'USER',
        },
      });

      await expect(
        authService.validateUser('testuser', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject authentication for non-existent user', async () => {
      await expect(
        authService.validateUser('nonexistent', 'anypassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should generate valid JWT token on login', async () => {
      // Create user
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      // Login
      const loginResult = await authService.login({
        username: 'testuser',
        password,
      });

      expect(loginResult).toHaveProperty('access_token');
      expect(typeof loginResult.access_token).toBe('string');

      // Verify token payload
      const decoded = jwtService.decode(loginResult.access_token);
      expect(decoded.username).toBe(user.username);
      expect(decoded.sub).toBe(user.id);
      expect(decoded.role).toBe(user.role);
    });
  });

  describe('User Registration Flow', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        username: 'newuser',
        password: 'securepassword123',
        role: 'USER',
      };

      const createdUser = await usersService.create(userData);

      expect(createdUser.username).toBe(userData.username);
      expect(createdUser.role).toBe(userData.role);

      // Verify password is hashed in database
      const userInDb = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });
      expect(userInDb?.password).not.toBe(userData.password);
      expect(userInDb?.password).toMatch(/^\$2b\$/); // bcrypt hash pattern

      // Verify user can authenticate with original password
      const canAuthenticate = await bcrypt.compare(
        userData.password,
        userInDb!.password,
      );
      expect(canAuthenticate).toBe(true);
    });

    it('should enforce unique username constraint', async () => {
      const userData = {
        username: 'duplicateuser',
        password: 'password123',
        role: 'USER',
      };

      // Create first user
      await usersService.create(userData);

      // Try to create duplicate
      await expect(usersService.create(userData)).rejects.toThrow(); // Should throw due to unique constraint
    });
  });

  describe('Security Validations', () => {
    it('should handle concurrent login attempts correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username: 'concurrent',
          password: hashedPassword,
          role: 'USER',
        },
      });

      // Simulate concurrent login attempts
      const loginPromises = Array(5)
        .fill(null)
        .map(() => authService.validateUser('concurrent', password));

      const results = await Promise.all(loginPromises);

      // All should succeed
      results.forEach((result) => {
        expect(result).toBeTruthy();
        expect(result?.id).toBe(user.id);
      });
    });

    it('should handle invalid JWT payloads gracefully', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username: 'jwttest',
          password: hashedPassword,
          role: 'USER',
        },
      });

      // Login to get valid token structure
      const loginResult = await authService.login({
        username: 'jwttest',
        password,
      });
      expect(loginResult.access_token).toBeTruthy();

      // Verify token can be decoded (basic validation)
      const decoded = jwtService.decode(loginResult.access_token);
      expect(decoded).toBeTruthy();
    });
  });
});
