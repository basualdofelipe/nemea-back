import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Role } from '../../common/types/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * @deprecated Replaced by PermissionsGuard in 12.1-01.
 * Kept temporarily until Plan 02 migrates all controllers.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown> | undefined;

    if (!user) {
      throw new ForbiddenException('Permisos insuficientes');
    }

    // Legacy: no longer functional since JwtUser no longer has string role.
    // Kept for compilation only. Will be removed in Plan 02.
    throw new ForbiddenException('Permisos insuficientes');
  }
}
