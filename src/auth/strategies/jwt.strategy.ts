import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Permissions } from '../../common/types/permission';
import { extractPermissions } from '../../common/types/permission';
import { UsersService } from '../../users/users.service';
import type { JwtUser } from '../decorators/current-user.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
  permissions: Permissions;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    const user = await this.usersService.findActiveByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    return {
      id: user.id,
      email: user.email,
      permissions: extractPermissions(user.role),
    };
  }
}
