import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { Permissions } from '../../common/types/permission';

export interface JwtUser {
  id: string;
  email: string;
  permissions: Permissions;
}

export const CurrentUser = createParamDecorator(
  (
    data: keyof JwtUser | undefined,
    ctx: ExecutionContext,
  ): JwtUser | JwtUser[keyof JwtUser] => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as JwtUser;

    if (data) {
      return user[data];
    }

    return user;
  },
);
