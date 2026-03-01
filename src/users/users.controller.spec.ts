import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../common/types/role.enum';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'admin@nemea.com',
    name: 'Admin Nemea',
    pictureUrl: null,
    googleId: null,
    role: Role.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
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
    it('should create a user with email and role', async () => {
      const dto = { email: 'new@nemea.com', role: Role.USER };
      const createdUser = { ...mockUser, ...dto, id: 2 };
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await controller.create(dto);

      expect(result).toEqual(createdUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('new@nemea.com');
      expect(usersService.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException for duplicate email', async () => {
      const dto = { email: 'admin@nemea.com', role: Role.ADMIN };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /users/:id', () => {
    it('should remove a user by id', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(usersService.remove).toHaveBeenCalledWith(1);
    });
  });
});
