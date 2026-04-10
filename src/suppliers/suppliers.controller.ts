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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermission('can_view_supplies')
  @ApiOperation({
    summary: 'Listar todos los proveedores (incluye inactivos)',
    description: 'Requires: can_view_supplies',
  })
  @ApiResponse({ status: 200, description: 'Lista de proveedores' })
  async findAll(): Promise<Supplier[]> {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  @RequirePermission('can_view_supplies')
  @ApiOperation({
    summary: 'Obtener un proveedor por ID',
    description: 'Requires: can_view_supplies',
  })
  @ApiResponse({ status: 200, description: 'Proveedor encontrado' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Supplier> {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @RequirePermission('can_edit_supplies')
  @ApiOperation({
    summary: 'Crear un proveedor',
    description: 'Requires: can_edit_supplies',
  })
  @ApiResponse({ status: 201, description: 'Proveedor creado exitosamente' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un proveedor activo con ese nombre',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere permiso can_edit_supplies',
  })
  async create(@Body() dto: CreateSupplierDto): Promise<Supplier> {
    return this.suppliersService.create(dto);
  }

  @Put(':id')
  @RequirePermission('can_edit_supplies')
  @ApiOperation({
    summary: 'Actualizar un proveedor',
    description: 'Requires: can_edit_supplies',
  })
  @ApiResponse({
    status: 200,
    description: 'Proveedor actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un proveedor activo con ese nombre',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere permiso can_edit_supplies',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ): Promise<Supplier> {
    return this.suppliersService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @RequirePermission('can_edit_supplies')
  @ApiOperation({
    summary: 'Alternar estado activo/inactivo del proveedor',
    description: 'Requires: can_edit_supplies',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del proveedor actualizado',
  })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere permiso can_edit_supplies',
  })
  async toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Supplier> {
    return this.suppliersService.toggleStatus(id);
  }

  @Delete(':id')
  @RequirePermission('can_edit_supplies')
  @ApiOperation({
    summary: 'Eliminar un proveedor permanentemente',
    description: 'Requires: can_edit_supplies',
  })
  @ApiResponse({
    status: 200,
    description: 'Proveedor eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar: proveedor tiene insumos asociados',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere permiso can_edit_supplies',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.suppliersService.remove(id);
  }
}
