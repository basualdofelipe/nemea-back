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
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/types/role.enum';
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
  @ApiOperation({ summary: 'Listar todos los insumos con precio actual' })
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
  @ApiOperation({ summary: 'Obtener un insumo por ID' })
  @ApiResponse({ status: 200, description: 'Insumo encontrado' })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SupplyWithPrice> {
    return this.suppliesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear un insumo' })
  @ApiResponse({ status: 201, description: 'Insumo creado exitosamente' })
  @ApiResponse({
    status: 409,
    description:
      'Ya existe un insumo activo con ese nombre para este proveedor',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async create(@Body() dto: CreateSupplyDto): Promise<SupplyWithPrice> {
    return this.suppliesService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un insumo' })
  @ApiResponse({ status: 200, description: 'Insumo actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  @ApiResponse({
    status: 409,
    description:
      'Ya existe un insumo activo con ese nombre para este proveedor',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplyDto,
  ): Promise<SupplyWithPrice> {
    return this.suppliesService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Alternar estado activo/inactivo del insumo',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del insumo actualizado',
  })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string): Promise<Supply> {
    return this.suppliesService.toggleStatus(id);
  }

  @Get(':id/prices')
  @ApiOperation({ summary: 'Obtener historial de precios de un insumo' })
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
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Agregar un nuevo precio a un insumo' })
  @ApiResponse({ status: 201, description: 'Precio agregado exitosamente' })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async addPrice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSupplyPriceDto,
  ): Promise<SupplyPriceHistory> {
    return this.suppliesService.addPrice(id, dto);
  }
}
