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
import { UpdateBomDto } from './dto/update-bom.dto';
import { BatchBomDto } from './dto/batch-bom.dto';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { BatchProductPriceDto } from './dto/batch-product-price.dto';
import { Product } from './entities/product.entity';
import { SuppliesPerProductHistory } from './entities/supplies-per-product-history.entity';
import { ProductPriceHistory } from './entities/product-price-history.entity';
import { ProductsService, ProductWithPrice } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ─── List / Batch Routes (BEFORE :id to avoid param conflicts) ─

  @Get()
  @ApiOperation({ summary: 'Listar todos los productos con precio actual' })
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
  ): Promise<ProductWithPrice[]> {
    return this.productsService.findAll(includeInactive ?? false);
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
    description: 'Forbidden -- requiere rol ADMIN',
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
    description: 'Forbidden -- requiere rol ADMIN',
  })
  async createBatch(@Body() dto: CreateBatchProductsDto): Promise<Product[]> {
    return this.productsService.createBatch(dto);
  }

  @Put('batch-bom')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Actualizar BOM de multiples productos a la vez',
  })
  @ApiResponse({
    status: 200,
    description: 'BOM actualizado para todos los productos',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto o insumo no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Insumo inactivo no puede agregarse al BOM',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden -- requiere rol ADMIN',
  })
  async batchUpdateBom(@Body() dto: BatchBomDto): Promise<void> {
    return this.productsService.batchUpdateBom(dto);
  }

  @Post('batch-prices')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Agregar el mismo precio a multiples productos',
  })
  @ApiResponse({
    status: 201,
    description: 'Precios agregados exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Uno o mas productos no encontrados',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden -- requiere rol ADMIN',
  })
  async batchAddPrice(
    @Body() dto: BatchProductPriceDto,
  ): Promise<ProductPriceHistory[]> {
    return this.productsService.batchAddPrice(dto);
  }

  // ─── :id Routes ────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.findOne(id);
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
    description: 'Forbidden -- requiere rol ADMIN',
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
    description: 'Forbidden -- requiere rol ADMIN',
  })
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.toggleStatus(id);
  }

  // ─── BOM Routes ────────────────────────────────────────────────

  @Get(':id/bom')
  @ApiOperation({ summary: 'Obtener BOM activo de un producto' })
  @ApiResponse({ status: 200, description: 'BOM del producto' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async getBom(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuppliesPerProductHistory[]> {
    return this.productsService.getBom(id);
  }

  @Put(':id/bom')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Actualizar BOM de un producto (version swap atomico)',
  })
  @ApiResponse({ status: 200, description: 'BOM actualizado exitosamente' })
  @ApiResponse({
    status: 404,
    description: 'Producto o insumo no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Insumo inactivo no puede agregarse al BOM',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden -- requiere rol ADMIN',
  })
  async updateBom(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBomDto,
  ): Promise<SuppliesPerProductHistory[]> {
    return this.productsService.updateBom(id, dto);
  }

  // ─── Price History Routes ──────────────────────────────────────

  @Get(':id/prices')
  @ApiOperation({ summary: 'Obtener historial de precios de un producto' })
  @ApiResponse({
    status: 200,
    description: 'Historial de precios del producto',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async getPriceHistory(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductPriceHistory[]> {
    return this.productsService.getPriceHistory(id);
  }

  @Post(':id/prices')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Agregar precio de venta a un producto' })
  @ApiResponse({
    status: 201,
    description: 'Precio agregado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden -- requiere rol ADMIN',
  })
  async addPrice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductPriceDto,
  ): Promise<ProductPriceHistory> {
    return this.productsService.addPrice(id, dto);
  }
}
