import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission('can_manage_users')
  @ApiOperation({
    summary: 'List all users (admin only)',
    description: 'Requires: can_manage_users',
  })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requires can_manage_users permission',
  })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Post()
  @RequirePermission('can_manage_users')
  @ApiOperation({
    summary: 'Add a user to the whitelist (admin only)',
    description: 'Requires: can_manage_users',
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requires can_manage_users permission',
  })
  async create(@Body() dto: CreateUserDto): Promise<User> {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('Email ya registrado');
    }

    return this.usersService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('can_manage_users')
  @ApiOperation({
    summary: 'Update user fields (admin only)',
    description: 'Requires: can_manage_users',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request — self-lockout guard or invalid payload',
  })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requires can_manage_users permission',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') callerId: string,
  ): Promise<User> {
    return this.usersService.update(id, dto, callerId);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('can_manage_users')
  @ApiOperation({
    summary: 'Hard-delete user and transfer scenarios (admin only)',
    description: 'Requires: can_manage_users',
  })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({
    status: 400,
    description: 'Bad request — self-lockout guard',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requires can_manage_users permission',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') callerId: string,
  ): Promise<void> {
    return this.usersService.remove(id, callerId);
  }
}
