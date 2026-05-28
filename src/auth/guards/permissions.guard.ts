import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  PERMISSION_TO_CAMEL,
  type Permission,
  type Permissions,
} from '../../common/types/permission';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    permissions: Permissions;
  };
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      Permission[] | undefined
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { user } = request;

    if (!user?.permissions) {
      throw new ForbiddenException('Permisos insuficientes');
    }

    const hasAll = requiredPermissions.every((perm) => {
      const camelKey = PERMISSION_TO_CAMEL[perm];
      return user.permissions[camelKey] === true;
    });

    if (!hasAll) {
      throw new ForbiddenException('Permisos insuficientes');
    }

    return true;
  }
}
