import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { extractPermissions } from '../common/types/permission';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;
  private readonly googleClientId: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.googleClientId =
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(this.googleClientId);
  }

  async validateGoogleToken(idToken: string): Promise<AuthResponseDto> {
    const payload = await this.verifyGoogleIdToken(idToken);

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Token de Google invalido');
    }

    const user = await this.usersService.findActiveByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    await this.usersService.updateGoogleProfile(user.id, {
      name: payload.name ?? null,
      pictureUrl: payload.picture ?? null,
      googleId: payload.sub,
    });

    const permissions = extractPermissions(user.role);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      permissions,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        permissions,
        name: payload.name ?? user.name ?? null,
        pictureUrl: payload.picture ?? user.pictureUrl ?? null,
      },
    };
  }

  async getProfile(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  async validateDemoLogin(email: string): Promise<AuthResponseDto> {
    const enabled = this.configService.get<string>('DEMO_LOGIN_ENABLED');
    if (enabled !== 'true') {
      throw new UnauthorizedException('Demo login no disponible');
    }

    const user = await this.usersService.findActiveByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuario demo no encontrado');
    }

    const permissions = extractPermissions(user.role);
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      permissions,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        permissions,
        name: user.name ?? null,
        pictureUrl: user.pictureUrl ?? null,
      },
    };
  }

  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<TokenPayload | undefined> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.googleClientId,
      });

      return ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token de Google invalido');
    }
  }
}
