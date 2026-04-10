import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
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
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CreateUserDto } from './dto/create-user.dto';
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

  @Patch(':id/toggle-status')
  @RequirePermission('can_manage_users')
  @ApiOperation({
    summary: 'Toggle user active status (admin only)',
    description: 'Requires: can_manage_users',
  })
  @ApiResponse({ status: 200, description: 'User status toggled' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requires can_manage_users permission',
  })
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (user.isActive) {
      await this.usersService.deactivate(id);
    } else {
      await this.usersService.activate(id);
    }
    const updated = await this.usersService.findById(id);
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return updated;
  }
}
