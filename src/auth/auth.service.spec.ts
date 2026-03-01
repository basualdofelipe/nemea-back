import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../common/types/role.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'admin@nemea.com',
    name: 'Admin Nemea',
    pictureUrl: 'https://lh3.googleusercontent.com/photo.jpg',
    googleId: 'google-sub-123',
    role: Role.ADMIN,
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
        email: 'admin@nemea.com',
        name: 'Admin Nemea',
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
      expect(result.user.id).toBe(1);
      expect(result.user.email).toBe('admin@nemea.com');
      expect(result.user.role).toBe(Role.ADMIN);
      expect(result.user.name).toBe('Admin Nemea');
      expect(result.user.pictureUrl).toBe(
        'https://lh3.googleusercontent.com/photo.jpg',
      );

      expect(usersService.findActiveByEmail).toHaveBeenCalledWith(
        'admin@nemea.com',
      );
      expect(usersService.updateGoogleProfile).toHaveBeenCalledWith(1, {
        name: 'Admin Nemea',
        pictureUrl: 'https://lh3.googleusercontent.com/photo.jpg',
        googleId: 'google-sub-123',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'admin@nemea.com',
        role: Role.ADMIN,
      });
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
        .mockRejectedValue(new Error('Invalid token'));

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

      const result = await service.getProfile(1);

      expect(result).toEqual(mockUser);
      expect(usersService.findById).toHaveBeenCalledWith(1);
    });

    it('should return null for nonexistent user', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      const result = await service.getProfile(999);

      expect(result).toBeNull();
    });
  });
});
