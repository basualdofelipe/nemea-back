import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { NO_PERMISSIONS } from '../common/types/permission';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { getDemoEmail } from '../constants/branding';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockRole = {
    id: 'role-uuid-1',
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

  const mockUser: Partial<User> = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'admin@hefesto.com',
    name: 'Admin Hefesto',
    pictureUrl: 'https://lh3.googleusercontent.com/photo.jpg',
    googleId: 'google-sub-123',
    role: mockRole as User['role'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findActiveByEmail: jest.fn(),
    findById: jest.fn(),
    updateGoogleProfile: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn().mockReturnValue('test-google-client-id'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateGoogleToken', () => {
    it('should return accessToken and user for a whitelisted email with valid token', async () => {
      // Mock the internal Google verification to return a valid payload
      const mockPayload = {
        email: 'admin@hefesto.com',
        name: 'Admin Hefesto',
        picture: 'https://lh3.googleusercontent.com/photo.jpg',
        sub: 'google-sub-123',
      };

      // We need to mock the google client's verifyIdToken
      // AuthService uses OAuth2Client internally, so we spy on the private method
      jest
        .spyOn(service as never, 'verifyGoogleIdToken' as never)
        .mockResolvedValue(mockPayload as never);

      mockUsersService.findActiveByEmail.mockResolvedValue(mockUser);
      mockUsersService.updateGoogleProfile.mockResolvedValue(undefined);
      mockJwtService.sign.mockReturnValue('mocked-jwt-token');

      const result: AuthResponseDto = await service.validateGoogleToken(
        'valid-google-id-token',
      );

      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.user.id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      expect(result.user.email).toBe('admin@hefesto.com');
      expect(result.user.permissions).toBeDefined();
      expect(result.user.permissions.canManageUsers).toBe(true);
      expect(result.user.name).toBe('Admin Hefesto');
      expect(result.user.pictureUrl).toBe(
        'https://lh3.googleusercontent.com/photo.jpg',
      );

      expect(usersService.findActiveByEmail).toHaveBeenCalledWith(
        'admin@hefesto.com',
      );
      expect(usersService.updateGoogleProfile).toHaveBeenCalledWith(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        {
          name: 'Admin Hefesto',
          pictureUrl: 'https://lh3.googleusercontent.com/photo.jpg',
          googleId: 'google-sub-123',
        },
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          email: 'admin@hefesto.com',
          permissions: expect.objectContaining({ canManageUsers: true }),
        }),
      );
    });

    it('should throw UnauthorizedException for non-whitelisted email', async () => {
      const mockPayload = {
        email: 'stranger@gmail.com',
        name: 'Stranger',
        picture: null,
        sub: 'google-sub-456',
      };

      jest
        .spyOn(service as never, 'verifyGoogleIdToken' as never)
        .mockResolvedValue(mockPayload as never);

      mockUsersService.findActiveByEmail.mockResolvedValue(null);

      await expect(
        service.validateGoogleToken('valid-but-not-whitelisted'),
      ).rejects.toThrow('Usuario no autorizado');
    });

    it('should throw UnauthorizedException for invalid Google token', async () => {
      jest
        .spyOn(service as never, 'verifyGoogleIdToken' as never)
        .mockRejectedValue(new Error('Invalid token') as never);

      await expect(
        service.validateGoogleToken('invalid-token'),
      ).rejects.toThrow();
    });

    it('should throw UnauthorizedException when Google payload has no email', async () => {
      const mockPayload = {
        email: undefined,
        name: 'No Email',
        picture: null,
        sub: 'google-sub-789',
      };

      jest
        .spyOn(service as never, 'verifyGoogleIdToken' as never)
        .mockResolvedValue(mockPayload as never);

      await expect(
        service.validateGoogleToken('token-no-email'),
      ).rejects.toThrow('Token de Google invalido');
    });
  });

  describe('getProfile', () => {
    it('should return a user by id', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      );

      expect(result).toEqual(mockUser);
      expect(usersService.findById).toHaveBeenCalledWith(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      );
    });

    it('should return null for nonexistent user', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      const result = await service.getProfile(
        'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      );

      expect(result).toBeNull();
    });
  });

  describe('extractPermissions via NO_PERMISSIONS', () => {
    it('NO_PERMISSIONS constant has all flags false', () => {
      expect(NO_PERMISSIONS.canManageUsers).toBe(false);
      expect(NO_PERMISSIONS.canViewProducts).toBe(false);
    });
  });

  describe('validateDemoLogin', () => {
    const DEMO_USER_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

    let originalDemoEmail: string | undefined;

    beforeEach(() => {
      originalDemoEmail = process.env.DEMO_EMAIL;
    });

    afterEach(() => {
      if (originalDemoEmail === undefined) {
        delete process.env.DEMO_EMAIL;
      } else {
        process.env.DEMO_EMAIL = originalDemoEmail;
      }
    });

    const mockDemoUser = {
      id: DEMO_USER_ID,
      email: getDemoEmail(),
      // Intentional fixture literal: this name is never asserted against; it
      // mirrors the seed's `Demo ${APP_NAME ?? 'Hefesto'}` default for realism only.
      name: 'Demo Hefesto',
      pictureUrl: null,
      isActive: true,
      role: {
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
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
      },
    };

    it('returns accessToken + user when flag=true and user exists', async () => {
      mockConfigService.get.mockReturnValue('true');
      mockUsersService.findActiveByEmail.mockResolvedValue(mockDemoUser);
      mockJwtService.sign.mockReturnValue('signed-token');

      const result = await service.validateDemoLogin(getDemoEmail());

      expect(result.accessToken).toBe('signed-token');
      expect(result.user.permissions).toBeDefined();
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockDemoUser.id,
          email: mockDemoUser.email,
        }),
      );
    });

    it('throws UnauthorizedException when DEMO_LOGIN_ENABLED=false', async () => {
      mockConfigService.get.mockReturnValue('false');

      await expect(service.validateDemoLogin(getDemoEmail())).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersService.findActiveByEmail).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when DEMO_LOGIN_ENABLED is unset', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.validateDemoLogin(getDemoEmail())).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockConfigService.get.mockReturnValue('true');
      mockUsersService.findActiveByEmail.mockResolvedValue(null);

      await expect(service.validateDemoLogin(getDemoEmail())).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('rejects any non-demo email even when flag=true (no privilege escalation)', async () => {
      mockConfigService.get.mockReturnValue('true');

      await expect(
        service.validateDemoLogin('admin@hefesto.com'),
      ).rejects.toThrow(UnauthorizedException);
      // The pinned demo account is never looked up for a foreign email.
      expect(mockUsersService.findActiveByEmail).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('looks up the pinned demo account, not the client-supplied address', async () => {
      mockConfigService.get.mockReturnValue('true');
      mockUsersService.findActiveByEmail.mockResolvedValue(mockDemoUser);
      mockJwtService.sign.mockReturnValue('signed-token');

      await service.validateDemoLogin(getDemoEmail());

      expect(mockUsersService.findActiveByEmail).toHaveBeenCalledWith(
        getDemoEmail(),
      );
    });

    it('respeta DEMO_EMAIL del env (override)', async () => {
      process.env.DEMO_EMAIL = 'demo@foo.com';
      mockConfigService.get.mockReturnValue('true');
      mockUsersService.findActiveByEmail.mockResolvedValue(mockDemoUser);
      mockJwtService.sign.mockReturnValue('signed-token');

      await expect(
        service.validateDemoLogin('demo@foo.com'),
      ).resolves.toBeDefined();

      await expect(
        service.validateDemoLogin('demo@hefesto.com'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
