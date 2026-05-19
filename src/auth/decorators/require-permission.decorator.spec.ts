import { Reflector } from '@nestjs/core';
import type { Permission } from '../../common/types/permission';
import {
  PERMISSIONS_KEY,
  RequirePermission,
} from './require-permission.decorator';

describe('RequirePermission decorator', () => {
  const reflector = new Reflector();

  describe('PERMISSIONS_KEY constant', () => {
    it('is a non-empty string', () => {
      expect(typeof PERMISSIONS_KEY).toBe('string');
      expect(PERMISSIONS_KEY.length).toBeGreaterThan(0);
    });
  });

  describe('metadata storage', () => {
    it('sets metadata under PERMISSIONS_KEY when a single permission is passed', () => {
      class TestClass {
        @RequirePermission('can_manage_users')
        testMethod(): void {
          return;
        }
      }

      const metadata = reflector.get<Permission[]>(
        PERMISSIONS_KEY,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toEqual(['can_manage_users']);
    });

    it('sets metadata with the exact permissions array when multiple permissions are passed', () => {
      class TestClass {
        @RequirePermission(
          'can_view_products',
          'can_edit_supplies',
          'can_manage_users',
        )
        testMethod(): void {
          return;
        }
      }

      const metadata = reflector.get<Permission[]>(
        PERMISSIONS_KEY,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toEqual([
        'can_view_products',
        'can_edit_supplies',
        'can_manage_users',
      ]);
    });

    it('sets an empty array when RequirePermission() is called with no arguments', () => {
      class TestClass {
        @RequirePermission()
        testMethod(): void {
          return;
        }
      }

      const metadata = reflector.get<Permission[]>(
        PERMISSIONS_KEY,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toEqual([]);
    });

    it('Reflector.get(PERMISSIONS_KEY, target) returns the exact same array contents passed to the decorator', () => {
      const perms: Permission[] = ['can_use_calculator', 'can_view_dashboard'];

      class TestClass {
        @RequirePermission('can_use_calculator', 'can_view_dashboard')
        testMethod(): void {
          return;
        }
      }

      const metadata = reflector.get<Permission[]>(
        PERMISSIONS_KEY,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toHaveLength(perms.length);
      expect(metadata).toEqual(perms);
    });

    it('does not bleed metadata between two independently decorated methods', () => {
      class TestClass {
        @RequirePermission('can_view_products')
        methodA(): void {
          return;
        }

        @RequirePermission('can_manage_users')
        methodB(): void {
          return;
        }
      }

      const metaA = reflector.get<Permission[]>(
        PERMISSIONS_KEY,
        TestClass.prototype.methodA,
      );
      const metaB = reflector.get<Permission[]>(
        PERMISSIONS_KEY,
        TestClass.prototype.methodB,
      );

      expect(metaA).toEqual(['can_view_products']);
      expect(metaB).toEqual(['can_manage_users']);
    });
  });
});
