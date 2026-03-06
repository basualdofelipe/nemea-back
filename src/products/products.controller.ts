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
import { CreateProductDto } from './dto/create-product.dto';
import { CreateBatchProductsDto } from './dto/create-batch-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los productos' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir productos inactivos',
  })
  @ApiResponse({ status: 200, description: 'Lista de productos' })
  async findAll(
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
  ): Promise<Product[]> {
    return this.productsService.findAll(includeInactive ?? false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear un producto' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un producto activo con esa combinacion',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  @Post('batch')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Crear productos en lote (colores x talles)',
  })
  @ApiResponse({
    status: 201,
    description: 'Productos creados exitosamente',
  })
  @ApiResponse({
    status: 409,
    description: 'Una o mas combinaciones ya existen como activas',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async createBatch(@Body() dto: CreateBatchProductsDto): Promise<Product[]> {
    return this.productsService.createBatch(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un producto activo con esa combinacion',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Alternar estado activo/inactivo del producto',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del producto actualizado',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.toggleStatus(id);
  }
}
