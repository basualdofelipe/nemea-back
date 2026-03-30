import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/types/role.enum';
import { ScenariosService } from './scenarios.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { UpdateScenarioDto } from './dto/update-scenario.dto';
import { UpsertOverridesDto } from './dto/upsert-overrides.dto';
import { ScenarioCalcResponse } from './dto/scenario-response.dto';
import { Scenario } from './entities/scenario.entity';
import { ScenarioOverride } from './entities/scenario-override.entity';

@ApiTags('scenarios')
@ApiBearerAuth()
@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Post()
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Create a new scenario' })
  @ApiResponse({ status: 201, description: 'Scenario created' })
  @ApiResponse({
    status: 409,
    description: 'Scenario name already exists for this user',
  })
  async create(
    @Body() dto: CreateScenarioDto,
    @CurrentUser('id') userId: string,
  ): Promise<Scenario> {
    return this.scenariosService.create(dto, userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'List own scenarios + public scenarios from others' })
  async findAll(@CurrentUser('id') userId: string): Promise<Scenario[]> {
    return this.scenariosService.findAll(userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get scenario with overrides' })
  @ApiResponse({
    status: 404,
    description: 'Scenario not found or not accessible',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Scenario> {
    return this.scenariosService.findOne(id, userId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Update scenario metadata (owner only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScenarioDto,
    @CurrentUser('id') userId: string,
  ): Promise<Scenario> {
    return this.scenariosService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Delete scenario and all overrides (owner or admin)',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser() user: JwtUser,
  ): Promise<void> {
    const isAdmin = user.permissions.canManageScenarios && user.permissions.canManageUsers;
    return this.scenariosService.remove(id, userId, isAdmin);
  }

  @Put(':id/overrides')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Bulk upsert override prices for scenario (owner only)',
  })
  async upsertOverrides(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertOverridesDto,
    @CurrentUser('id') userId: string,
  ): Promise<ScenarioOverride[]> {
    return this.scenariosService.upsertOverrides(id, dto, userId);
  }

  @Get(':id/calculate')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Calculate margins for all products in scenario',
  })
  async calculate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ScenarioCalcResponse> {
    return this.scenariosService.calculate(id, userId);
  }

  @Patch(':id/toggle-public')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Toggle scenario public visibility (owner only)',
  })
  async togglePublic(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Scenario> {
    return this.scenariosService.togglePublic(id, userId);
  }
}
