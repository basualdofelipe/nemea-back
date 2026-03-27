import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/types/role.enum';
import {
  ParsedGatewayRate,
  ParsedInstallmentRate,
  ParsedPlan,
  ParsedTaxConfig,
  TiendanubeConfigAll,
  TiendanubeConfigService,
} from './tiendanube-config.service';
import { TnPaymentGateway } from './entities/tn-payment-gateway.entity';
import { UpdateGatewayRateDto } from './dto/update-gateway-rate.dto';
import { UpdateInstallmentRateDto } from './dto/update-installment-rate.dto';
import { UpdateTaxConfigDto } from './dto/update-tax-config.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@ApiTags('Tiendanube Config')
@ApiBearerAuth()
@Controller('tiendanube-config')
export class TiendanubeConfigController {
  constructor(private readonly configService: TiendanubeConfigService) {}

  @Get('all')
  @ApiOperation({ summary: 'Obtener toda la configuracion de Tiendanube' })
  @ApiResponse({
    status: 200,
    description:
      'Configuracion completa (gateways, tasas, cuotas, impuestos, planes)',
  })
  async getAll(): Promise<TiendanubeConfigAll> {
    return this.configService.getAll();
  }

  @Get('gateways')
  @ApiOperation({ summary: 'Obtener pasarelas de pago con tasas actuales' })
  @ApiResponse({
    status: 200,
    description: 'Pasarelas con tasas agrupadas',
  })
  async getGateways(): Promise<
    (TnPaymentGateway & { rates: ParsedGatewayRate[] })[]
  > {
    return this.configService.getGatewaysWithRates();
  }

  @Put('gateway-rates/:gatewayId')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Actualizar tasa de una pasarela (crea nuevo registro historico)',
  })
  @ApiResponse({ status: 200, description: 'Tasa actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Pasarela no encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async updateGatewayRate(
    @Param('gatewayId', ParseUUIDPipe) gatewayId: string,
    @Body() dto: UpdateGatewayRateDto,
  ): Promise<ParsedGatewayRate> {
    return this.configService.updateGatewayRate(gatewayId, dto);
  }

  @Get('installments')
  @ApiOperation({ summary: 'Obtener tasas de cuotas actuales' })
  @ApiResponse({
    status: 200,
    description: 'Tasas de cuotas (ultima por cantidad de cuotas)',
  })
  async getInstallments(): Promise<ParsedInstallmentRate[]> {
    return this.configService.getInstallmentRates();
  }

  @Put('installment-rates/:installments')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Actualizar tasa de cuotas (crea nuevo registro historico)',
  })
  @ApiResponse({ status: 200, description: 'Tasa de cuotas actualizada' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async updateInstallmentRate(
    @Param('installments', ParseIntPipe) installments: number,
    @Body() dto: UpdateInstallmentRateDto,
  ): Promise<ParsedInstallmentRate> {
    return this.configService.updateInstallmentRate(installments, dto);
  }

  @Get('taxes')
  @ApiOperation({ summary: 'Obtener configuracion de impuestos actual' })
  @ApiResponse({
    status: 200,
    description: 'Configuracion de impuestos (IVA, IIBB)',
  })
  async getTaxes(): Promise<ParsedTaxConfig | null> {
    return this.configService.getTaxConfig();
  }

  @Put('taxes')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Actualizar configuracion de impuestos (crea nuevo registro historico)',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuracion de impuestos actualizada',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async updateTaxConfig(
    @Body() dto: UpdateTaxConfigDto,
  ): Promise<ParsedTaxConfig> {
    return this.configService.updateTaxConfig(dto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Obtener planes de Tiendanube activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de planes activos',
  })
  async getPlans(): Promise<ParsedPlan[]> {
    return this.configService.getPlans();
  }

  @Put('plans/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar tasas CPT de un plan' })
  @ApiResponse({ status: 200, description: 'Plan actualizado' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requiere rol ADMIN',
  })
  async updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<ParsedPlan> {
    return this.configService.updatePlan(id, dto);
  }
}
