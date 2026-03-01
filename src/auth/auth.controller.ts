import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Google id_token for backend JWT' })
  @ApiResponse({
    status: 200,
    description: 'Google token exchanged successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid Google token or user not whitelisted',
  })
  async googleLogin(@Body() dto: GoogleAuthDto): Promise<AuthResponseDto> {
    return this.authService.validateGoogleToken(dto.idToken);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile returned successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated or user not found',
  })
  async getProfile(@CurrentUser() user: JwtUser): Promise<User> {
    const profile = await this.authService.getProfile(user.id);

    if (!profile) {
      throw new UnauthorizedException();
    }

    return profile;
  }
}
