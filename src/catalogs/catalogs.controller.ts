import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/types/role.enum';
import { CatalogsService } from './catalogs.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';

const DIMENSION_ENUM = [
  'product-types',
  'product-names',
  'product-finishes',
  'product-colors',
  'product-sizes',
  'supply-types',
  'expense-categories',
];

@ApiTags('catalogs')
@ApiBearerAuth()
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get(':dimension')
  @ApiParam({
    name: 'dimension',
    enum: DIMENSION_ENUM,
    description: 'Dimension del catalogo',
  })
  @ApiOperation({ summary: 'Listar items de una dimension del catalogo' })
  @ApiResponse({ status: 200, description: 'Lista de items del catalogo' })
  @ApiResponse({ status: 404, description: 'Dimension no encontrada' })
  async findAll(
    @Param('dimension') dimension: string,
  ): Promise<{ id: string; name: string }[]> {
    return this.catalogsService.findAll(dimension);
  }

  @Post(':dimension')
  @Roles(Role.ADMIN)
  @ApiParam({
    name: 'dimension',
    enum: DIMENSION_ENUM,
    description: 'Dimension del catalogo',
  })
  @ApiOperation({ summary: 'Crear un item en una dimension del catalogo' })
  @ApiResponse({ status: 201, description: 'Item creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe un item con ese nombre' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async create(
    @Param('dimension') dimension: string,
    @Body() dto: CreateCatalogItemDto,
  ): Promise<{ id: string; name: string }> {
    return this.catalogsService.create(dimension, dto);
  }

  @Put(':dimension/:id')
  @Roles(Role.ADMIN)
  @ApiParam({
    name: 'dimension',
    enum: DIMENSION_ENUM,
    description: 'Dimension del catalogo',
  })
  @ApiOperation({
    summary: 'Actualizar un item de una dimension del catalogo',
  })
  @ApiResponse({ status: 200, description: 'Item actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya existe un item con ese nombre' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async update(
    @Param('dimension') dimension: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogItemDto,
  ): Promise<{ id: string; name: string }> {
    return this.catalogsService.update(dimension, id, dto);
  }

  @Delete(':dimension/:id')
  @Roles(Role.ADMIN)
  @ApiParam({
    name: 'dimension',
    enum: DIMENSION_ENUM,
    description: 'Dimension del catalogo',
  })
  @ApiOperation({
    summary: 'Eliminar un item de una dimension del catalogo',
  })
  @ApiResponse({ status: 200, description: 'Item eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar: item en uso',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async remove(
    @Param('dimension') dimension: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.catalogsService.remove(dimension, id);
  }
}
