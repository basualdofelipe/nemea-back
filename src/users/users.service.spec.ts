import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { NO_PERMISSIONS } from '../common/types/permission';
import { ScenariosService } from '../scenarios/scenarios.service';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const VICTIM_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const CALLER_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
  const ADMIN_ROLE_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
  const EDITOR_ROLE_ID = 'd4e5f6a7-b8c9-0123-defa-234567890123';

  const adminRole = {
    id: ADMIN_ROLE_ID,
    name: 'ADMIN',
    isSystem: true,
    ...Object.fromEntries(Object.keys(NO_PERMISSIONS).map((k) => [k, true])),
  };

  const editorRole = {
    id: EDITOR_ROLE_ID,
    name: 'EDITOR',
    isSystem: false,
    ...Object.fromEntries(Object.keys(NO_PERMISSIONS).map((k) => [k, false])),
    canViewProducts: true,
  };

  const mockUser: Partial<User> = {
    id: VICTIM_ID,
    email: 'admin@nemea.com',
    name: 'Admin Nemea',
    pictureUrl: null,
    googleId: null,
    role: adminRole as User['role'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(1),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      delete: jest.fn(),
    },
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    manager: {
      connection: {
        createQueryRunner: jest.fn(() => mockQueryRunner),
      },
    },
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockScenariosService = {
    transferOwnership: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: ScenariosService,
          useValue: mockScenariosService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();

    // Restore chain semantics after jest.clearAllMocks wipes mockReturnThis
    mockQueryBuilder.innerJoin.mockReturnThis();
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.getCount.mockResolvedValue(1);
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockRepository.manager.connection.createQueryRunner.mockReturnValue(
      mockQueryRunner,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findActiveByEmail', () => {
    it('should return an active user by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findActiveByEmail('admin@nemea.com');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@nemea.com', isActive: true },
      });
    });

    it('should return null for nonexistent email', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findActiveByEmail('nonexistent@email.com');

      expect(result).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@email.com', isActive: true },
      });
    });

    it('should return null for deactivated user', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findActiveByEmail('deactivated@email.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a user with roleId and return it', async () => {
      const dto = {
        email: 'new@user.com',
        roleId: ADMIN_ROLE_ID,
        name: 'New User',
      };
      const createdUser = {
        ...mockUser,
        email: dto.email,
        name: dto.name,
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      };
      mockRoleRepository.findOne.mockResolvedValue(adminRole);
      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);

      const result = await service.create(dto);

      expect(result).toEqual(createdUser);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: ADMIN_ROLE_ID },
      });
      expect(repository.save).toHaveBeenCalledWith(createdUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(VICTIM_ID);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: VICTIM_ID },
      });
    });

    it('should return null for nonexistent id', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(
        'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      );

      expect(result).toBeNull();
    });
  });

  describe('updateGoogleProfile', () => {
    it('should update google profile data', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateGoogleProfile(VICTIM_ID, {
        name: 'Google Name',
        pictureUrl: 'https://example.com/pic.jpg',
        googleId: '123456',
      });

      expect(repository.update).toHaveBeenCalledWith(VICTIM_ID, {
        name: 'Google Name',
        pictureUrl: 'https://example.com/pic.jpg',
        googleId: '123456',
      });
    });
  });

  describe('update', () => {
    it('actualiza name cuando victim !== caller', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        name: 'Old Name',
        role: editorRole,
        isActive: true,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockRepository.save.mockImplementation((u: User) => Promise.resolve(u));

      const result = await service.update(
        VICTIM_ID,
        { name: 'New Name' },
        CALLER_ID,
      );

      expect(result.name).toBe('New Name');
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('actualiza role cuando roleId nuevo y valido', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        role: editorRole,
        isActive: true,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockRoleRepository.findOne.mockResolvedValue(adminRole);
      mockRepository.save.mockImplementation((u: User) => Promise.resolve(u));

      const result = await service.update(
        VICTIM_ID,
        { roleId: ADMIN_ROLE_ID },
        CALLER_ID,
      );

      expect(result.role).toEqual(adminRole);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: ADMIN_ROLE_ID },
      });
    });

    it('actualiza isActive cuando victim !== caller', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        role: editorRole,
        isActive: true,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockRepository.save.mockImplementation((u: User) => Promise.resolve(u));

      const result = await service.update(
        VICTIM_ID,
        { isActive: false },
        CALLER_ID,
      );

      expect(result.isActive).toBe(false);
    });

    it('throws NotFoundException con Usuario no encontrado cuando user no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(VICTIM_ID, { name: 'X' }, CALLER_ID),
      ).rejects.toThrow(new NotFoundException('Usuario no encontrado'));
    });

    it('throws NotFoundException con Rol no encontrado cuando roleId no existe', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        role: editorRole,
        isActive: true,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(VICTIM_ID, { roleId: ADMIN_ROLE_ID }, CALLER_ID),
      ).rejects.toThrow(new NotFoundException('Rol no encontrado'));
    });

    it('throws BadRequestException No puedes cambiar tu propio rol cuando victim === caller y roleId distinto', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        role: editorRole,
        isActive: true,
      };
      mockRepository.findOne.mockResolvedValue(victim);

      await expect(
        service.update(VICTIM_ID, { roleId: ADMIN_ROLE_ID }, VICTIM_ID),
      ).rejects.toThrow(
        new BadRequestException('No puedes cambiar tu propio rol'),
      );
    });

    it('NO throws cuando victim === caller y roleId igual al actual', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        role: editorRole,
        isActive: true,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockRepository.save.mockImplementation((u: User) => Promise.resolve(u));

      const result = await service.update(
        VICTIM_ID,
        { roleId: editorRole.id },
        VICTIM_ID,
      );

      expect(result.role).toEqual(editorRole);
      expect(mockRoleRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws BadRequestException No puedes desactivar tu propia cuenta cuando victim === caller y isActive false', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        role: editorRole,
        isActive: true,
      };
      mockRepository.findOne.mockResolvedValue(victim);

      await expect(
        service.update(VICTIM_ID, { isActive: false }, VICTIM_ID),
      ).rejects.toThrow(
        new BadRequestException('No puedes desactivar tu propia cuenta'),
      );
    });

    it('throws ultimo-admin cuando demote del ultimo admin via roleId no-admin', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        role: adminRole,
        isActive: true,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockRoleRepository.findOne.mockResolvedValue(editorRole);
      mockQueryBuilder.getCount.mockResolvedValueOnce(0);

      await expect(
        service.update(VICTIM_ID, { roleId: EDITOR_ROLE_ID }, CALLER_ID),
      ).rejects.toThrow(
        new BadRequestException(
          'No se puede dejar el sistema sin administradores activos',
        ),
      );
    });

    it('throws ultimo-admin cuando desactivar ultimo admin', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        role: adminRole,
        isActive: true,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockQueryBuilder.getCount.mockResolvedValueOnce(0);

      await expect(
        service.update(VICTIM_ID, { isActive: false }, CALLER_ID),
      ).rejects.toThrow(
        new BadRequestException(
          'No se puede dejar el sistema sin administradores activos',
        ),
      );
    });
  });

  describe('remove', () => {
    it('happy path: transferOwnership + manager.delete + commit', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        name: 'V',
        role: editorRole,
        isActive: false,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockScenariosService.transferOwnership.mockResolvedValue(undefined);
      mockQueryRunner.manager.delete.mockResolvedValue({ affected: 1 });

      await service.remove(VICTIM_ID, CALLER_ID);

      expect(mockScenariosService.transferOwnership).toHaveBeenCalledWith(
        VICTIM_ID,
        CALLER_ID,
        expect.stringContaining(' - '),
        mockQueryRunner,
      );
      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
        User,
        VICTIM_ID,
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('throws self-delete con No puedes borrarte a vos mismo cuando id === callerId', async () => {
      await expect(service.remove(VICTIM_ID, VICTIM_ID)).rejects.toThrow(
        new BadRequestException('No puedes borrarte a vos mismo'),
      );
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(
        mockRepository.manager.connection.createQueryRunner,
      ).not.toHaveBeenCalled();
    });

    it('throws NotFoundException cuando user no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(VICTIM_ID, CALLER_ID)).rejects.toThrow(
        new NotFoundException('Usuario no encontrado'),
      );
      expect(
        mockRepository.manager.connection.createQueryRunner,
      ).not.toHaveBeenCalled();
    });

    it('throws ultimo-admin cuando borrando unico admin activo', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        role: adminRole,
        isActive: true,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockQueryBuilder.getCount.mockResolvedValueOnce(0);

      await expect(service.remove(VICTIM_ID, CALLER_ID)).rejects.toThrow(
        new BadRequestException(
          'No se puede dejar el sistema sin administradores activos',
        ),
      );
      expect(
        mockRepository.manager.connection.createQueryRunner,
      ).not.toHaveBeenCalled();
    });

    it('cuando victim.name === "" usa fallback "usuario borrado" en el suffix (CR-02)', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        name: '',
        role: editorRole,
        isActive: false,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockScenariosService.transferOwnership.mockResolvedValue(undefined);
      mockQueryRunner.manager.delete.mockResolvedValue({ affected: 1 });

      await service.remove(VICTIM_ID, CALLER_ID);

      expect(mockScenariosService.transferOwnership).toHaveBeenCalledWith(
        VICTIM_ID,
        CALLER_ID,
        ` - usuario borrado #${VICTIM_ID.slice(0, 8)}`,
        mockQueryRunner,
      );
    });

    it('cuando victim.name === "   " (whitespace) usa fallback "usuario borrado" en el suffix (CR-02)', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        name: '   ',
        role: editorRole,
        isActive: false,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockScenariosService.transferOwnership.mockResolvedValue(undefined);
      mockQueryRunner.manager.delete.mockResolvedValue({ affected: 1 });

      await service.remove(VICTIM_ID, CALLER_ID);

      expect(mockScenariosService.transferOwnership).toHaveBeenCalledWith(
        VICTIM_ID,
        CALLER_ID,
        ` - usuario borrado #${VICTIM_ID.slice(0, 8)}`,
        mockQueryRunner,
      );
    });

    it('cuando victim.name tiene whitespace al borde lo trimmea en el suffix (CR-02)', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        name: '  Juan  ',
        role: editorRole,
        isActive: false,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockScenariosService.transferOwnership.mockResolvedValue(undefined);
      mockQueryRunner.manager.delete.mockResolvedValue({ affected: 1 });

      await service.remove(VICTIM_ID, CALLER_ID);

      expect(mockScenariosService.transferOwnership).toHaveBeenCalledWith(
        VICTIM_ID,
        CALLER_ID,
        ` - Juan #${VICTIM_ID.slice(0, 8)}`,
        mockQueryRunner,
      );
    });

    it('incluye un slice corto del UUID de victim en el suffix para evitar colisiones (WR-01)', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        name: 'Maria',
        role: editorRole,
        isActive: false,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockScenariosService.transferOwnership.mockResolvedValue(undefined);
      mockQueryRunner.manager.delete.mockResolvedValue({ affected: 1 });

      await service.remove(VICTIM_ID, CALLER_ID);

      const expectedSuffix = ` - Maria #${VICTIM_ID.slice(0, 8)}`;
      expect(mockScenariosService.transferOwnership).toHaveBeenCalledWith(
        VICTIM_ID,
        CALLER_ID,
        expectedSuffix,
        mockQueryRunner,
      );
    });

    it('rollbackea cuando transferOwnership falla', async () => {
      const victim = {
        ...mockUser,
        id: VICTIM_ID,
        name: 'V',
        role: editorRole,
        isActive: false,
      };
      mockRepository.findOne.mockResolvedValue(victim);
      mockScenariosService.transferOwnership.mockRejectedValue(
        new Error('overflow'),
      );

      await expect(service.remove(VICTIM_ID, CALLER_ID)).rejects.toThrow(
        'overflow',
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.manager.delete).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
