import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
  NO_PERMISSIONS,
  type Permissions,
} from '../../common/types/permission';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { PermissionsGuard } from './permissions.guard';

function makeContext(
  user: { id: string; email: string; permissions: Permissions } | undefined,
): ExecutionContext {
  return {
    getHandler: jest.fn().mockReturnValue({}),
    getClass: jest.fn().mockReturnValue({}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsGuard, Reflector],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('when no @RequirePermission metadata is set', () => {
    it('returns true when PERMISSIONS_KEY is missing (undefined)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const ctx = makeContext(undefined);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('returns true when PERMISSIONS_KEY resolves to an empty array', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
      const ctx = makeContext(undefined);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });
  });

  describe('when permissions are required but no user is on the request', () => {
    it('throws ForbiddenException with message "Permisos insuficientes" when user is undefined', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['can_view_products']);
      const ctx = makeContext(undefined);

      expect(() => guard.canActivate(ctx)).toThrow(
        new ForbiddenException('Permisos insuficientes'),
      );
    });
  });

  describe('when a user is present but lacks permissions', () => {
    it('throws ForbiddenException when user has none of the required permissions', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['can_manage_users']);
      const noPermsUser = {
        id: 'user-1',
        email: 'user@hefesto.com',
        permissions: { ...NO_PERMISSIONS },
      };
      const ctx = makeContext(noPermsUser);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user has some but not all required permissions (must require ALL)', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['can_view_products', 'can_manage_users']);
      const partialUser = {
        id: 'user-2',
        email: 'user@hefesto.com',
        permissions: {
          ...NO_PERMISSIONS,
          canViewProducts: true,
          // canManageUsers is false — must fail
        },
      };
      const ctx = makeContext(partialUser);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('when user has all required permissions', () => {
    it('returns true for a single required permission', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['can_view_products']);
      const user = {
        id: 'user-3',
        email: 'user@hefesto.com',
        permissions: {
          ...NO_PERMISSIONS,
          canViewProducts: true,
        },
      };
      const ctx = makeContext(user);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('returns true when user has every one of multiple required permissions', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([
          'can_view_products',
          'can_edit_products',
          'can_manage_users',
        ]);
      const adminUser = {
        id: 'admin-1',
        email: 'admin@hefesto.com',
        permissions: {
          ...NO_PERMISSIONS,
          canViewProducts: true,
          canEditProducts: true,
          canManageUsers: true,
        },
      };
      const ctx = makeContext(adminUser);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });
  });

  describe('PERMISSION_TO_CAMEL mapping', () => {
    it('maps snake_case can_manage_users to camelCase canManageUsers on the permissions object', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['can_manage_users']);

      const userWithManage = {
        id: 'admin-2',
        email: 'admin@hefesto.com',
        permissions: {
          ...NO_PERMISSIONS,
          canManageUsers: true,
        },
      };
      const ctxAllow = makeContext(userWithManage);
      expect(guard.canActivate(ctxAllow)).toBe(true);

      const userWithoutManage = {
        id: 'regular-1',
        email: 'regular@hefesto.com',
        permissions: { ...NO_PERMISSIONS },
      };
      const ctxDeny = makeContext(userWithoutManage);
      expect(() => guard.canActivate(ctxDeny)).toThrow(ForbiddenException);
    });

    it('uses getAllAndOverride with PERMISSIONS_KEY constant', () => {
      const spy = jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(undefined);
      const ctx = makeContext(undefined);

      guard.canActivate(ctx);

      expect(spy).toHaveBeenCalledWith(PERMISSIONS_KEY, expect.any(Array));
    });
  });
});
