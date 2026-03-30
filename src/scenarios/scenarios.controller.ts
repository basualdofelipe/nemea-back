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
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
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
  @RequirePermission('can_manage_scenarios')
  @ApiOperation({ summary: 'Create a new scenario', description: 'Requires: can_manage_scenarios' })
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
  @RequirePermission('can_manage_scenarios')
  @ApiOperation({ summary: 'List own scenarios + public scenarios from others', description: 'Requires: can_manage_scenarios' })
  async findAll(@CurrentUser('id') userId: string): Promise<Scenario[]> {
    return this.scenariosService.findAll(userId);
  }

  @Get(':id')
  @RequirePermission('can_manage_scenarios')
  @ApiOperation({ summary: 'Get scenario with overrides', description: 'Requires: can_manage_scenarios' })
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
  @RequirePermission('can_manage_scenarios')
  @ApiOperation({ summary: 'Update scenario metadata (owner only)', description: 'Requires: can_manage_scenarios' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScenarioDto,
    @CurrentUser('id') userId: string,
  ): Promise<Scenario> {
    return this.scenariosService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermission('can_manage_scenarios')
  @ApiOperation({
    summary: 'Delete scenario and all overrides (owner or admin)',
    description: 'Requires: can_manage_scenarios',
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
  @RequirePermission('can_manage_scenarios')
  @ApiOperation({
    summary: 'Bulk upsert override prices for scenario (owner only)',
    description: 'Requires: can_manage_scenarios',
  })
  async upsertOverrides(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertOverridesDto,
    @CurrentUser('id') userId: string,
  ): Promise<ScenarioOverride[]> {
    return this.scenariosService.upsertOverrides(id, dto, userId);
  }

  @Get(':id/calculate')
  @RequirePermission('can_manage_scenarios')
  @ApiOperation({
    summary: 'Calculate margins for all products in scenario',
    description: 'Requires: can_manage_scenarios',
  })
  async calculate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ScenarioCalcResponse> {
    return this.scenariosService.calculate(id, userId);
  }

  @Patch(':id/toggle-public')
  @RequirePermission('can_manage_scenarios')
  @ApiOperation({
    summary: 'Toggle scenario public visibility (owner only)',
    description: 'Requires: can_manage_scenarios',
  })
  async togglePublic(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Scenario> {
    return this.scenariosService.togglePublic(id, userId);
  }
}
