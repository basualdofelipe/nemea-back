import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';

const makeRole = (overrides: Partial<Role> = {}): Role =>
  ({
    id: 'role-uuid-1',
    name: 'EDITOR',
    description: null,
    isSystem: false,
    canViewProducts: false,
    canEditProducts: false,
    canViewSupplies: false,
    canEditSupplies: false,
    canViewExpenses: false,
    canEditExpenses: false,
    canUseCalculator: false,
    canManageScenarios: false,
    canViewDashboard: false,
    canManageConfig: false,
    canManageUsers: false,
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Role;

describe('RolesService', () => {
  let service: RolesService;

  // QueryBuilder mock — returned by createQueryBuilder()
  const mockQb = {
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockRoleRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    merge: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserRepo = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    jest.clearAllMocks();
    // Re-attach chaining mocks after clearAllMocks
    mockRoleRepo.createQueryBuilder.mockReturnValue(mockQb);
    mockQb.loadRelationCountAndMap.mockReturnThis();
    mockQb.orderBy.mockReturnThis();
    mockQb.addOrderBy.mockReturnThis();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------
  describe('findAll', () => {
    it('builds query with loadRelationCountAndMap userCount, orderBy isSystem DESC and name ASC', async () => {
      const roles = [makeRole()];
      mockQb.getMany.mockResolvedValue(roles);

      const result = await service.findAll();

      expect(mockRoleRepo.createQueryBuilder).toHaveBeenCalledWith('role');
      expect(mockQb.loadRelationCountAndMap).toHaveBeenCalledWith(
        'role.userCount',
        'role.users',
      );
      expect(mockQb.orderBy).toHaveBeenCalledWith('role.isSystem', 'DESC');
      expect(mockQb.addOrderBy).toHaveBeenCalledWith('role.name', 'ASC');
      expect(result).toEqual(roles);
    });
  });

  // ---------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------
  describe('findOne', () => {
    it('returns the role when found', async () => {
      const role = makeRole();
      mockRoleRepo.findOne.mockResolvedValue(role);

      const result = await service.findOne('role-uuid-1');

      expect(result).toEqual(role);
      expect(mockRoleRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'role-uuid-1' },
      });
    });

    it('throws NotFoundException("Rol no encontrado") when role does not exist', async () => {
      mockRoleRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        new NotFoundException('Rol no encontrado'),
      );
    });
  });

  // ---------------------------------------------------------------
  // create
  // ---------------------------------------------------------------
  describe('create', () => {
    it('throws ConflictException when a role with the same name already exists', async () => {
      const dto: CreateRoleDto = { name: 'EDITOR' };
      mockRoleRepo.findOne.mockResolvedValue(makeRole({ name: 'EDITOR' }));

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('saves and returns the new role when name is unique', async () => {
      const dto: CreateRoleDto = { name: 'VISOR', canViewProducts: true };
      const created = makeRole({ name: 'VISOR', canViewProducts: true });
      mockRoleRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.create.mockReturnValue(created);
      mockRoleRepo.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(mockRoleRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRoleRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  // ---------------------------------------------------------------
  // update
  // ---------------------------------------------------------------
  describe('update', () => {
    it('throws BadRequestException when trying to rename a system role', async () => {
      const systemRole = makeRole({ name: 'ADMIN', isSystem: true });
      mockRoleRepo.findOne.mockResolvedValue(systemRole);
      const dto: UpdateRoleDto = { name: 'SUPERADMIN' };

      await expect(service.update('role-uuid-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException (admin-lockout) when ADMIN role has canManageUsers set to false', async () => {
      const adminRole = makeRole({
        name: 'ADMIN',
        isSystem: true,
        canManageUsers: true,
      });
      // findOne called twice — once in update itself, once inside findOne helper
      mockRoleRepo.findOne.mockResolvedValue(adminRole);
      const dto: UpdateRoleDto = { canManageUsers: false };

      await expect(service.update('role-uuid-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException when renaming to a name already used by another role', async () => {
      const role = makeRole({ name: 'EDITOR', isSystem: false });
      const conflictRole = makeRole({ id: 'other-id', name: 'VISOR' });
      // findOne called: 1st for findOne(id), 2nd for conflict check
      mockRoleRepo.findOne
        .mockResolvedValueOnce(role)
        .mockResolvedValueOnce(conflictRole);
      const dto: UpdateRoleDto = { name: 'VISOR' };

      await expect(service.update('role-uuid-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('merges dto into role and saves on the happy path', async () => {
      const role = makeRole({ name: 'EDITOR', isSystem: false });
      const saved = makeRole({ name: 'EDITOR', canViewProducts: true });
      // dto has no name change — conflict check branch is skipped entirely,
      // so only one findOne call is made (the findOne(id) inside update).
      mockRoleRepo.findOne.mockResolvedValue(role);
      mockRoleRepo.merge.mockImplementation(
        (target: Role, source: Partial<Role>) => Object.assign(target, source),
      );
      mockRoleRepo.save.mockResolvedValue(saved);
      const dto: UpdateRoleDto = { canViewProducts: true };

      const result = await service.update('role-uuid-1', dto);

      expect(mockRoleRepo.merge).toHaveBeenCalledWith(role, dto);
      expect(mockRoleRepo.save).toHaveBeenCalled();
      expect(result).toEqual(saved);
    });
  });

  // ---------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------
  describe('remove', () => {
    it('throws BadRequestException when trying to remove a system role', async () => {
      const systemRole = makeRole({ isSystem: true });
      // findOne is called inside remove → findOne(id). Mock must return the role.
      mockRoleRepo.findOne.mockResolvedValue(systemRole);

      await expect(service.remove(systemRole.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException("No se puede eliminar un rol con usuarios asignados") when users are assigned', async () => {
      const role = makeRole({ isSystem: false });
      mockRoleRepo.findOne.mockResolvedValue(role);
      mockUserRepo.count.mockResolvedValue(3);

      await expect(service.remove('role-uuid-1')).rejects.toThrow(
        new BadRequestException(
          'No se puede eliminar un rol con usuarios asignados',
        ),
      );
    });

    it('calls roleRepo.delete when role is not system and has no users', async () => {
      const role = makeRole({ isSystem: false });
      mockRoleRepo.findOne.mockResolvedValue(role);
      mockUserRepo.count.mockResolvedValue(0);
      mockRoleRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove('role-uuid-1');

      expect(mockRoleRepo.delete).toHaveBeenCalledWith('role-uuid-1');
    });
  });
});
