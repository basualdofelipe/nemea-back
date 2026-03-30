import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Permissions } from '../common/types/permission';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtUser } from './decorators/current-user.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';

const adminPermissions: Permissions = {
  canViewProducts: true,
  canEditProducts: true,
  canViewSupplies: true,
  canEditSupplies: true,
  canViewExpenses: true,
  canEditExpenses: true,
  canUseCalculator: true,
  canManageScenarios: true,
  canViewDashboard: true,
  canManageConfig: true,
  canManageUsers: true,
};

const mockAdminRole: Partial<Role> = {
  id: 'role-admin-uuid',
  name: 'ADMIN',
  isSystem: true,
  canViewProducts: true,
  canEditProducts: true,
  canViewSupplies: true,
  canEditSupplies: true,
  canViewExpenses: true,
  canEditExpenses: true,
  canUseCalculator: true,
  canManageScenarios: true,
  canViewDashboard: true,
  canManageConfig: true,
  canManageUsers: true,
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthResponse: AuthResponseDto = {
    accessToken: 'mocked-jwt-token',
    user: {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      email: 'admin@nemea.com',
      permissions: adminPermissions,
      name: 'Admin Nemea',
      pictureUrl: 'https://lh3.googleusercontent.com/photo.jpg',
    },
  };

  const mockUser: Partial<User> = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'admin@nemea.com',
    name: 'Admin Nemea',
    pictureUrl: 'https://lh3.googleusercontent.com/photo.jpg',
    googleId: 'google-sub-123',
    role: mockAdminRole as Role,
    isActive: true,
  };

  const mockAuthService = {
    validateGoogleToken: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/google', () => {
    it('should return accessToken and user for valid Google token', async () => {
      const dto: GoogleAuthDto = { idToken: 'valid-google-id-token' };
      mockAuthService.validateGoogleToken.mockResolvedValue(mockAuthResponse);

      const result = await controller.googleLogin(dto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.validateGoogleToken).toHaveBeenCalledWith(
        'valid-google-id-token',
      );
    });

    it('should propagate UnauthorizedException for non-whitelisted email', async () => {
      const dto: GoogleAuthDto = { idToken: 'valid-but-not-whitelisted' };
      mockAuthService.validateGoogleToken.mockRejectedValue(
        new UnauthorizedException('Usuario no autorizado'),
      );

      await expect(controller.googleLogin(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should propagate UnauthorizedException for invalid token', async () => {
      const dto: GoogleAuthDto = { idToken: 'invalid-token' };
      mockAuthService.validateGoogleToken.mockRejectedValue(
        new UnauthorizedException('Token de Google invalido'),
      );

      await expect(controller.googleLogin(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('GET /auth/me', () => {
    it('should return user profile for authenticated user', async () => {
      const jwtUser: JwtUser = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        email: 'admin@nemea.com',
        permissions: adminPermissions,
      };
      mockAuthService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(jwtUser);

      expect(result).toEqual(mockUser);
      expect(authService.getProfile).toHaveBeenCalledWith(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      );
    });

    it('should throw UnauthorizedException when user not found in DB', async () => {
      const jwtUser: JwtUser = {
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        email: 'deleted@nemea.com',
        permissions: adminPermissions,
      };
      mockAuthService.getProfile.mockResolvedValue(null);

      await expect(controller.getProfile(jwtUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
