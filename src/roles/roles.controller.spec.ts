import { Test, TestingModule } from '@nestjs/testing';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { RolesController } from './roles.controller';
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

describe('RolesController', () => {
  let controller: RolesController;
  let rolesService: RolesService;

  const mockRolesService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [{ provide: RolesService, useValue: mockRolesService }],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    rolesService = module.get<RolesService>(RolesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /roles', () => {
    it('delegates to service.findAll() and returns its result', async () => {
      const roles = [
        makeRole(),
        makeRole({ id: 'role-uuid-2', name: 'VISOR' }),
      ];
      mockRolesService.findAll.mockResolvedValue(roles);

      const result = await controller.findAll();

      expect(result).toEqual(roles);
      expect(rolesService.findAll).toHaveBeenCalledTimes(1);
      expect(rolesService.findAll).toHaveBeenCalledWith();
    });
  });

  describe('POST /roles', () => {
    it('delegates to service.create(dto) with the exact dto', async () => {
      const dto: CreateRoleDto = {
        name: 'VISOR',
        canViewProducts: true,
      };
      const created = makeRole({ name: 'VISOR', canViewProducts: true });
      mockRolesService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toEqual(created);
      expect(rolesService.create).toHaveBeenCalledTimes(1);
      expect(rolesService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('PATCH /roles/:id', () => {
    it('delegates to service.update(id, dto) with the exact id and dto', async () => {
      const id = 'role-uuid-1';
      const dto: UpdateRoleDto = { canManageUsers: true };
      const updated = makeRole({ canManageUsers: true });
      mockRolesService.update.mockResolvedValue(updated);

      const result = await controller.update(id, dto);

      expect(result).toEqual(updated);
      expect(rolesService.update).toHaveBeenCalledTimes(1);
      expect(rolesService.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('DELETE /roles/:id', () => {
    it('delegates to service.remove(id) and returns void', async () => {
      const id = 'role-uuid-3';
      mockRolesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(result).toBeUndefined();
      expect(rolesService.remove).toHaveBeenCalledTimes(1);
      expect(rolesService.remove).toHaveBeenCalledWith(id);
    });
  });
});
