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
import { CreateProductDto } from './dto/create-product.dto';
import { CreateBatchProductsDto } from './dto/create-batch-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateBomDto } from './dto/update-bom.dto';
import { BatchBomDto } from './dto/batch-bom.dto';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { BatchProductPriceDto } from './dto/batch-product-price.dto';
import { CostsService } from '../costs/costs.service';
import { ProductWithCost } from '../costs/dto/product-with-cost.dto';
import { Product } from './entities/product.entity';
import { SuppliesPerProductHistory } from './entities/supplies-per-product-history.entity';
import { ProductPriceHistory } from './entities/product-price-history.entity';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly costsService: CostsService,
  ) {}

  // ─── List / Batch Routes (BEFORE :id to avoid param conflicts) ─

  @Get()
  @RequirePermission('can_view_products')
  @ApiOperation({
    summary: 'Listar todos los productos con precio actual',
    description: 'Requires: can_view_products',
  })
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
  ): Promise<ProductWithCost[]> {
    const products = await this.productsService.findAll(
      includeInactive ?? false,
    );
    const costMap = await this.costsService.calculateAll();

    return products.map((product) => {
      const costData = costMap.get(product.id);
      return Object.assign(product, {
        cost: costData?.cost ?? null,
        costBreakdown: null,
        costWarnings: costData?.costWarnings ?? [],
      });
    });
  }

  @Post()
  @RequirePermission('can_edit_products')
  @ApiOperation({
    summary: 'Crear un producto',
    description: 'Requires: can_edit_products',
  })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un producto activo con esa combinacion',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden -- requiere permiso can_edit_products',
  })
  async create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  @Post('batch')
  @RequirePermission('can_edit_products')
  @ApiOperation({
    summary: 'Crear productos en lote (colores x talles)',
    description: 'Requires: can_edit_products',
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
    description: 'Forbidden -- requiere permiso can_edit_products',
  })
  async createBatch(@Body() dto: CreateBatchProductsDto): Promise<Product[]> {
    return this.productsService.createBatch(dto);
  }

  @Put('batch-bom')
  @RequirePermission('can_edit_products')
  @ApiOperation({
    summary: 'Actualizar BOM de multiples productos a la vez',
    description: 'Requires: can_edit_products',
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
    description: 'Forbidden -- requiere permiso can_edit_products',
  })
  async batchUpdateBom(@Body() dto: BatchBomDto): Promise<void> {
    return this.productsService.batchUpdateBom(dto);
  }

  @Post('batch-prices')
  @RequirePermission('can_edit_products')
  @ApiOperation({
    summary: 'Agregar el mismo precio a multiples productos',
    description: 'Requires: can_edit_products',
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
    description: 'Forbidden -- requiere permiso can_edit_products',
  })
  async batchAddPrice(
    @Body() dto: BatchProductPriceDto,
  ): Promise<ProductPriceHistory[]> {
    return this.productsService.batchAddPrice(dto);
  }

  // ─── :id Routes ────────────────────────────────────────────────

  @Get(':id')
  @RequirePermission('can_view_products')
  @ApiOperation({
    summary: 'Obtener un producto por ID con costo y desglose',
    description: 'Requires: can_view_products',
  })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado con datos de costo',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductWithCost> {
    const product = await this.productsService.findOneWithPrice(id);
    const costData = await this.costsService.calculateForProduct(id);

    return Object.assign(product, {
      cost: costData?.cost ?? null,
      costBreakdown: costData?.costBreakdown ?? null,
      costWarnings: costData?.costWarnings ?? [],
    });
  }

  @Put(':id')
  @RequirePermission('can_edit_products')
  @ApiOperation({
    summary: 'Actualizar un producto',
    description: 'Requires: can_edit_products',
  })
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
    description: 'Forbidden -- requiere permiso can_edit_products',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @RequirePermission('can_edit_products')
  @ApiOperation({
    summary: 'Alternar estado activo/inactivo del producto',
    description: 'Requires: can_edit_products',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del producto actualizado',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden -- requiere permiso can_edit_products',
  })
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.toggleStatus(id);
  }

  // ─── BOM Routes ────────────────────────────────────────────────

  @Get(':id/bom')
  @RequirePermission('can_view_products')
  @ApiOperation({
    summary: 'Obtener BOM activo de un producto',
    description: 'Requires: can_view_products',
  })
  @ApiResponse({ status: 200, description: 'BOM del producto' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async getBom(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuppliesPerProductHistory[]> {
    return this.productsService.getBom(id);
  }

  @Put(':id/bom')
  @RequirePermission('can_edit_products')
  @ApiOperation({
    summary: 'Actualizar BOM de un producto (version swap atomico)',
    description: 'Requires: can_edit_products',
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
    description: 'Forbidden -- requiere permiso can_edit_products',
  })
  async updateBom(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBomDto,
  ): Promise<SuppliesPerProductHistory[]> {
    return this.productsService.updateBom(id, dto);
  }

  // ─── Price History Routes ──────────────────────────────────────

  @Get(':id/prices')
  @RequirePermission('can_view_products')
  @ApiOperation({
    summary: 'Obtener historial de precios de un producto',
    description: 'Requires: can_view_products',
  })
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
  @RequirePermission('can_edit_products')
  @ApiOperation({
    summary: 'Agregar precio de venta a un producto',
    description: 'Requires: can_edit_products',
  })
  @ApiResponse({
    status: 201,
    description: 'Precio agregado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden -- requiere permiso can_edit_products',
  })
  async addPrice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductPriceDto,
  ): Promise<ProductPriceHistory> {
    return this.productsService.addPrice(id, dto);
  }
}
