import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../roles/entities/role.entity';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

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

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUser: Partial<User> = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'admin@nemea.com',
    name: 'Admin Nemea',
    pictureUrl: null,
    googleId: null,
    role: mockAdminRole as Role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    deactivate: jest.fn(),
    activate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /users', () => {
    it('should return list of users', async () => {
      const users = [mockUser];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('POST /users', () => {
    it('should create a user with email and roleId', async () => {
      const dto = { email: 'new@nemea.com', roleId: 'role-user-uuid' };
      const createdUser = {
        ...mockUser,
        email: dto.email,
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      };
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await controller.create(dto);

      expect(result).toEqual(createdUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('new@nemea.com');
      expect(usersService.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException for duplicate email', async () => {
      const dto = { email: 'admin@nemea.com' };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /users/:id/toggle-status', () => {
    it('should deactivate an active user', async () => {
      const activeUser = { ...mockUser, isActive: true };
      const deactivatedUser = { ...mockUser, isActive: false };
      mockUsersService.findById
        .mockResolvedValueOnce(activeUser)
        .mockResolvedValueOnce(deactivatedUser);
      mockUsersService.deactivate.mockResolvedValue(undefined);

      const result = await controller.toggleStatus(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      );

      expect(result).toEqual(deactivatedUser);
      expect(usersService.deactivate).toHaveBeenCalledWith(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      );
    });

    it('should activate an inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      const activatedUser = { ...mockUser, isActive: true };
      mockUsersService.findById
        .mockResolvedValueOnce(inactiveUser)
        .mockResolvedValueOnce(activatedUser);
      mockUsersService.activate.mockResolvedValue(undefined);

      const result = await controller.toggleStatus(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      );

      expect(result).toEqual(activatedUser);
      expect(usersService.activate).toHaveBeenCalledWith(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      );
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(
        controller.toggleStatus('a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
