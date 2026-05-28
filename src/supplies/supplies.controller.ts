import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { CreateSupplyPriceDto } from './dto/create-supply-price.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { SuppliesService, SupplyWithPrice } from './supplies.service';
import { Supply } from './entities/supply.entity';
import { SupplyPriceHistory } from './entities/supply-price-history.entity';

@ApiTags('Supplies')
@ApiBearerAuth()
@Controller('supplies')
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Get()
  @RequirePermission('can_view_supplies')
  @ApiOperation({
    summary: 'Listar todos los insumos con precio actual',
    description: 'Requires: can_view_supplies',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir insumos inactivos',
  })
  @ApiResponse({ status: 200, description: 'Lista de insumos' })
  async findAll(
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
  ): Promise<SupplyWithPrice[]> {
    return this.suppliesService.findAll(includeInactive ?? false);
  }

  @Get(':id')
  @RequirePermission('can_view_supplies')
  @ApiOperation({
    summary: 'Obtener un insumo por ID',
    description: 'Requires: can_view_supplies',
  })
  @ApiResponse({ status: 200, description: 'Insumo encontrado' })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SupplyWithPrice> {
    return this.suppliesService.findOne(id);
  }

  @Post()
  @RequirePermission('can_edit_supplies')
  @ApiOperation({
    summary: 'Crear un insumo',
    description: 'Requires: can_edit_supplies',
  })
  @ApiResponse({ status: 201, description: 'Insumo creado exitosamente' })
  @ApiResponse({
    status: 409,
    description:
      'Ya existe un insumo activo con ese nombre para este proveedor',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere permiso can_edit_supplies',
  })
  async create(@Body() dto: CreateSupplyDto): Promise<SupplyWithPrice> {
    return this.suppliesService.create(dto);
  }

  @Put(':id')
  @RequirePermission('can_edit_supplies')
  @ApiOperation({
    summary: 'Actualizar un insumo',
    description: 'Requires: can_edit_supplies',
  })
  @ApiResponse({ status: 200, description: 'Insumo actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  @ApiResponse({
    status: 409,
    description:
      'Ya existe un insumo activo con ese nombre para este proveedor',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere permiso can_edit_supplies',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplyDto,
  ): Promise<SupplyWithPrice> {
    return this.suppliesService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @RequirePermission('can_edit_supplies')
  @ApiOperation({
    summary: 'Alternar estado activo/inactivo del insumo',
    description: 'Requires: can_edit_supplies',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del insumo actualizado',
  })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere permiso can_edit_supplies',
  })
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string): Promise<Supply> {
    return this.suppliesService.toggleStatus(id);
  }

  @Get(':id/prices')
  @RequirePermission('can_view_supplies')
  @ApiOperation({
    summary: 'Obtener historial de precios de un insumo',
    description: 'Requires: can_view_supplies',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de precios (mas reciente primero)',
  })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  async getPriceHistory(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SupplyPriceHistory[]> {
    return this.suppliesService.getPriceHistory(id);
  }

  @Post(':id/prices')
  @RequirePermission('can_edit_supplies')
  @ApiOperation({
    summary: 'Agregar un nuevo precio a un insumo',
    description: 'Requires: can_edit_supplies',
  })
  @ApiResponse({ status: 201, description: 'Precio agregado exitosamente' })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere permiso can_edit_supplies',
  })
  async addPrice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSupplyPriceDto,
  ): Promise<SupplyPriceHistory> {
    return this.suppliesService.addPrice(id, dto);
  }
}
