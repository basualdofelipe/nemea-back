import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NO_PERMISSIONS } from '../common/types/permission';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockRole = {
    id: 'role-uuid-1',
    name: 'ADMIN',
    isSystem: true,
    ...Object.fromEntries(Object.keys(NO_PERMISSIONS).map((k) => [k, true])),
  };

  const mockUser: Partial<User> = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'admin@nemea.com',
    name: 'Admin Nemea',
    pictureUrl: null,
    googleId: null,
    role: mockRole as User['role'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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
    it('should create a user with email and roleId', async () => {
      const dto = { email: 'new@nemea.com', roleId: 'role-uuid-1' };
      const createdUser = {
        ...mockUser,
        ...dto,
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      };
      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await controller.create(dto);

      expect(result).toEqual(createdUser);
      // WR-A4: controller no longer pre-checks via findByEmail. The
      // service catches the @Unique(['email']) DB constraint and throws
      // ConflictException itself, eliminating the TOCTOU race.
      expect(usersService.findByEmail).not.toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalledWith(dto);
    });

    it('should propagate ConflictException for duplicate email from service', async () => {
      const dto = { email: 'admin@nemea.com', roleId: 'role-uuid-1' };
      mockUsersService.create.mockRejectedValue(
        new ConflictException('Email ya registrado'),
      );

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('PATCH /users/:id', () => {
    const VICTIM_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const CALLER_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

    it('forwards id, dto, callerId to service.update and returns updated user', async () => {
      const dto = { name: 'Nuevo' };
      const updatedUser = { ...mockUser, name: 'Nuevo' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(VICTIM_ID, dto, CALLER_ID);

      expect(result).toEqual(updatedUser);
      expect(usersService.update).toHaveBeenCalledWith(
        VICTIM_ID,
        dto,
        CALLER_ID,
      );
    });

    it('propagates BadRequestException from service (self-role-edit guard)', async () => {
      mockUsersService.update.mockRejectedValue(
        new BadRequestException('No puedes cambiar tu propio rol'),
      );

      await expect(
        controller.update(
          CALLER_ID,
          { roleId: 'd4e5f6a7-b8c9-0123-def1-234567890123' },
          CALLER_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('propagates NotFoundException from service when user does not exist', async () => {
      mockUsersService.update.mockRejectedValue(
        new NotFoundException('Usuario no encontrado'),
      );

      await expect(
        controller.update(VICTIM_ID, { name: 'X' }, CALLER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /users/:id', () => {
    const VICTIM_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const CALLER_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

    it('forwards id and callerId to service.remove and returns void', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(VICTIM_ID, CALLER_ID);

      expect(result).toBeUndefined();
      expect(usersService.remove).toHaveBeenCalledWith(VICTIM_ID, CALLER_ID);
    });

    it('propagates BadRequestException (self-delete) from service', async () => {
      mockUsersService.remove.mockRejectedValue(
        new BadRequestException('No puedes borrarte a vos mismo'),
      );

      await expect(controller.remove(CALLER_ID, CALLER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('propagates BadRequestException (last-admin) from service', async () => {
      mockUsersService.remove.mockRejectedValue(
        new BadRequestException(
          'No se puede dejar el sistema sin administradores activos',
        ),
      );

      await expect(controller.remove(VICTIM_ID, CALLER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('propagates NotFoundException from service when user does not exist', async () => {
      mockUsersService.remove.mockRejectedValue(
        new NotFoundException('Usuario no encontrado'),
      );

      await expect(controller.remove(VICTIM_ID, CALLER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
