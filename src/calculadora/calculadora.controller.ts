import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { TiendanubeConfigService } from '../tiendanube-config/tiendanube-config.service';
import { CostsService } from '../costs/costs.service';
import { CalculadoraService } from './calculadora.service';
import { CalcForwardDto } from './dto/calc-forward.dto';
import { CalcInverseDto } from './dto/calc-inverse.dto';
import { CalcBatchDto } from './dto/calc-batch.dto';
import {
  CalcResult,
  CalcInverseResult,
  CalcBatchItem,
  CalcError,
} from './dto/calc-result.dto';

@ApiTags('calculadora')
@ApiBearerAuth()
@Controller('calculadora')
export class CalculadoraController {
  constructor(
    private readonly calculadoraService: CalculadoraService,
    private readonly tiendanubeConfigService: TiendanubeConfigService,
    private readonly costsService: CostsService,
  ) {}

  @Post('forward')
  @RequirePermission('can_use_calculator')
  @ApiOperation({
    summary: 'Calcular ganancia real a partir de precio de venta (forward)',
    description: 'Requires: can_use_calculator',
  })
  @ApiResponse({
    status: 200,
    description: 'Desglose completo de la operacion',
  })
  @ApiResponse({
    status: 404,
    description: 'Gateway rate, installment rate, or tax config not found',
  })
  async forward(@Body() dto: CalcForwardDto): Promise<CalcResult> {
    const config = await this.tiendanubeConfigService.getAll();

    // If productId provided, fetch cost from DB
    let costoProducto = dto.costoProducto ?? 0;
    if (dto.productId) {
      const costData = await this.costsService.calculateForProduct(
        dto.productId,
      );
      if (costData) {
        costoProducto = costData.cost;
      }
    }

    // Return CalcResult directly -- ResponseInterceptor wraps to { data: CalcResult }
    return this.calculadoraService.calcForward({
      precioVenta: dto.precioVenta,
      costoEnvio: dto.costoEnvio,
      costoProducto,
      gatewaySlug: dto.gatewaySlug,
      paymentMethod: dto.paymentMethod,
      withdrawalDays: dto.withdrawalDays,
      installments: dto.installments,
      planSlug: dto.planSlug,
      config,
    });
  }

  @Post('inverse')
  @RequirePermission('can_use_calculator')
  @ApiOperation({
    summary:
      'Calcular precio de venta necesario para ganancia deseada (inverse)',
    description: 'Requires: can_use_calculator',
  })
  @ApiResponse({
    status: 200,
    description: 'Precio de venta calculado con desglose completo',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (zero cost, negative profit, unreachable)',
  })
  @ApiResponse({
    status: 404,
    description: 'Gateway rate, installment rate, or tax config not found',
  })
  async inverse(@Body() dto: CalcInverseDto): Promise<CalcInverseResult> {
    const config = await this.tiendanubeConfigService.getAll();

    // If productId provided, fetch cost from DB
    let costoProducto = dto.costoProducto ?? 0;
    if (dto.productId) {
      const costData = await this.costsService.calculateForProduct(
        dto.productId,
      );
      if (costData) {
        costoProducto = costData.cost;
      }
    }

    const result = this.calculadoraService.calcInverse({
      gananciaDeseada: dto.gananciaDeseada,
      costoEnvio: dto.costoEnvio,
      costoProducto,
      gatewaySlug: dto.gatewaySlug,
      paymentMethod: dto.paymentMethod,
      withdrawalDays: dto.withdrawalDays,
      installments: dto.installments,
      planSlug: dto.planSlug,
      config,
    });

    // On CalcError, throw BadRequestException
    if ((result as CalcError).error) {
      throw new BadRequestException((result as CalcError).message);
    }

    // Return CalcInverseResult directly -- ResponseInterceptor wraps to { data: CalcInverseResult }
    return result as CalcInverseResult;
  }

  @Post('batch')
  @RequirePermission('can_use_calculator')
  @ApiOperation({
    summary: 'Calcular margenes de todos los productos (batch)',
    description: 'Requires: can_use_calculator',
  })
  @ApiResponse({
    status: 200,
    description: 'Array de productos con su resultado de calculo',
  })
  @ApiResponse({
    status: 404,
    description: 'Gateway rate, installment rate, or tax config not found',
  })
  async batch(@Body() dto: CalcBatchDto): Promise<CalcBatchItem[]> {
    // Return CalcBatchItem[] directly -- ResponseInterceptor wraps to { data: CalcBatchItem[] }
    return this.calculadoraService.calcBatch({
      gatewaySlug: dto.gatewaySlug,
      paymentMethod: dto.paymentMethod,
      withdrawalDays: dto.withdrawalDays,
      installments: dto.installments,
      planSlug: dto.planSlug,
    });
  }
}
