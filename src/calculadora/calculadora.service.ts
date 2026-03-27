import { Injectable, NotFoundException } from '@nestjs/common';
import {
  TiendanubeConfigService,
  TiendanubeConfigAll,
  ParsedGatewayRate,
  ParsedInstallmentRate,
  ParsedPlan,
} from '../tiendanube-config/tiendanube-config.service';
import { CostsService } from '../costs/costs.service';
import { ProductsService } from '../products/products.service';
import {
  CalcResult,
  CalcInverseResult,
  CalcBatchItem,
  CalcError,
} from './dto/calc-result.dto';

interface ResolvedRates {
  gatewayRate: number;
  installmentRate: number;
  ivaRate: number;
  iibbRate: number;
  cptRate: number;
}

interface CalcForwardParams {
  precioVenta: number;
  costoEnvio: number;
  costoProducto: number;
  gatewaySlug: string;
  paymentMethod: string;
  withdrawalDays: number;
  installments: number;
  planSlug?: string;
  config: TiendanubeConfigAll;
}

interface CalcInverseParams {
  gananciaDeseada: number;
  costoEnvio: number;
  costoProducto: number;
  gatewaySlug: string;
  paymentMethod: string;
  withdrawalDays: number;
  installments: number;
  planSlug?: string;
  config: TiendanubeConfigAll;
}

@Injectable()
export class CalculadoraService {
  constructor(
    private readonly tiendanubeConfigService: TiendanubeConfigService,
    private readonly costsService: CostsService,
    private readonly productsService: ProductsService,
  ) {}

  // ─── Private: resolve rates from config ─────────────────────────

  private resolveRates(
    config: TiendanubeConfigAll,
    gatewaySlug: string,
    paymentMethod: string,
    withdrawalDays: number,
    installments: number,
    planSlug?: string,
  ): ResolvedRates {
    // Null check: taxConfig can be null from getAll()
    if (!config.taxConfig) {
      throw new NotFoundException(
        'Tax config not found. Configure IVA/IIBB in Configuracion > Tiendanube first.',
      );
    }

    // Find matching gateway rate
    // CRITICAL BUG #1: Raw SQL returns snake_case field names.
    // rate.paymentMethod and rate.withdrawalDays are UNDEFINED.
    // Must use bracket notation to access the real snake_case keys.
    const matchedRate = config.rates.find((rate: ParsedGatewayRate) => {
      const rateGatewaySlug =
        rate.gateway?.slug ??
        (rate as Record<string, unknown>)['gateway']?.toString();
      const ratePaymentMethod = (rate as Record<string, unknown>)[
        'payment_method'
      ] as string | undefined;
      const rateWithdrawalDays = (rate as Record<string, unknown>)[
        'withdrawal_days'
      ] as number | undefined;

      return (
        rateGatewaySlug === gatewaySlug &&
        ratePaymentMethod === paymentMethod &&
        Number(rateWithdrawalDays) === withdrawalDays
      );
    });

    if (!matchedRate) {
      throw new NotFoundException(
        `Gateway rate not found for ${gatewaySlug}/${paymentMethod}/${withdrawalDays}d`,
      );
    }

    // CRITICAL BUG #1: ratePercent is NaN (from parseFloat(undefined)).
    // Read the REAL value from rate_percent (snake_case string from raw SQL).
    const gatewayRatePercent = parseFloat(
      (matchedRate as Record<string, unknown>)['rate_percent'] as string,
    );
    if (isNaN(gatewayRatePercent)) {
      throw new Error(
        `Invalid gateway rate_percent for ${gatewaySlug}/${paymentMethod}/${withdrawalDays}d`,
      );
    }

    // Find matching installment rate
    const matchedInstallment = config.installments.find(
      (inst: ParsedInstallmentRate) => inst.installments === installments,
    );

    if (!matchedInstallment) {
      throw new NotFoundException(
        `Installment rate not found for ${installments} installments`,
      );
    }

    const installmentRatePercent = parseFloat(
      (matchedInstallment as Record<string, unknown>)['rate_percent'] as string,
    );
    if (isNaN(installmentRatePercent)) {
      throw new Error(
        `Invalid installment rate_percent for ${installments} installments`,
      );
    }

    // Find plan for CPT rate
    const plan = planSlug
      ? config.plans.find((p: ParsedPlan) => p.slug === planSlug)
      : config.plans[0];

    if (!plan) {
      throw new NotFoundException(`Plan not found: ${planSlug ?? 'default'}`);
    }

    // CPT depends on gateway: pago_nube uses cptPagoNube, others use cptOtherGateways
    const cptRate =
      gatewaySlug === 'pago_nube' ? plan.cptPagoNube : plan.cptOtherGateways;

    // CRITICAL BUG #2: IVA/IIBB stored as percentages (21, 3.5),
    // but formulas need fractions (0.21, 0.035). Divide by 100.
    return {
      gatewayRate: gatewayRatePercent, // stays as percentage (3.49) -- divided by 100 in formula
      installmentRate: installmentRatePercent, // stays as percentage -- divided by 100 in formula
      ivaRate: config.taxConfig.ivaRate / 100, // 21 -> 0.21 (fraction)
      iibbRate: config.taxConfig.iibbRate / 100, // 3.5 -> 0.035 (fraction)
      cptRate, // stays as percentage -- divided by 100 in formula
    };
  }

  // ─── calcForward: price -> profit (14-step formula) ─────────────

  calcForward(params: CalcForwardParams): CalcResult {
    const {
      precioVenta,
      costoEnvio,
      costoProducto,
      gatewaySlug,
      paymentMethod,
      withdrawalDays,
      installments,
      planSlug,
      config,
    } = params;

    const rates = this.resolveRates(
      config,
      gatewaySlug,
      paymentMethod,
      withdrawalDays,
      installments,
      planSlug,
    );

    // Step 1: Total paid by client
    const totalCliente = precioVenta + costoEnvio;

    // Step 2: Gateway base rate
    const tasaBase = rates.gatewayRate;

    // Step 3: Rate with IVA (ivaRate is already a fraction: 0.21)
    const tasaConIVA = tasaBase * (1 + rates.ivaRate);

    // Step 4: Gateway commission
    const comisionPasarela = totalCliente * (tasaConIVA / 100);

    // Step 5: Installment financing cost
    const tasaCuotas = rates.installmentRate;
    const costoFinanciacion = totalCliente * (tasaCuotas / 100);

    // Step 6: CPT (Tiendanube transaction cost)
    const cpt = totalCliente * (rates.cptRate / 100);

    // Step 7: IVA calculations
    const baseGravada = totalCliente / (1 + rates.ivaRate);
    const ivaDebito = totalCliente - baseGravada;
    const ivaCreditoProducto = costoProducto * rates.ivaRate;
    const ivaCreditoComision =
      comisionPasarela * (rates.ivaRate / (1 + rates.ivaRate));
    const ivaNeto = ivaDebito - ivaCreditoProducto - ivaCreditoComision;

    // Step 8: IIBB retention (iibbRate is already a fraction: 0.035)
    const retencionIIBB = totalCliente * rates.iibbRate;

    // Step 9: Net received from gateway (subtract CPT too)
    const netoRecibido =
      totalCliente - comisionPasarela - costoFinanciacion - retencionIIBB - cpt;

    // Step 10: Product cost with IVA
    const costoProductoConIVA = costoProducto * (1 + rates.ivaRate);

    // Step 11: Real profit
    const gananciaReal = netoRecibido - costoProductoConIVA - ivaNeto;

    // Step 12: Margin percentage
    const margen = precioVenta > 0 ? (gananciaReal / precioVenta) * 100 : 0;

    // Round only final values (per CONTEXT.md -- NO intermediate rounding)
    return {
      totalCliente,
      tasaBase,
      tasaConIVA,
      comisionPasarela,
      tasaCuotas,
      costoFinanciacion,
      cpt,
      baseGravada,
      ivaDebito,
      ivaCreditoProducto,
      ivaCreditoComision,
      ivaNeto,
      retencionIIBB,
      netoRecibido,
      costoProductoConIVA,
      gananciaReal: Math.round(gananciaReal * 100) / 100,
      margen: Math.round(margen * 100) / 100,
    };
  }

  // ─── calcInverse: profit -> price (binary search) ───────────────

  calcInverse(params: CalcInverseParams): CalcInverseResult | CalcError {
    const { gananciaDeseada, costoProducto } = params;

    // Edge case validations
    if (costoProducto <= 0) {
      return { error: true, message: 'Defini el costo del producto primero' };
    }

    if (gananciaDeseada < 0) {
      return {
        error: true,
        message: 'La ganancia deseada debe ser positiva',
      };
    }

    // Binary search bounds
    let low = costoProducto;
    let high = Math.max(costoProducto * 20, 100000);

    // Check if target is reachable at upper bound
    const upperResult = this.calcForward({
      ...params,
      precioVenta: high,
    });
    if (upperResult.gananciaReal < gananciaDeseada) {
      return {
        error: true,
        message: 'Ganancia inalcanzable con estas tasas',
      };
    }

    // Binary search with epsilon convergence
    let mid = 0;
    let result: CalcResult = upperResult;
    let iterations = 0;

    while (high - low > 0.01 && iterations < 100) {
      mid = (low + high) / 2;
      result = this.calcForward({
        ...params,
        precioVenta: mid,
      });

      if (result.gananciaReal < gananciaDeseada) {
        low = mid;
      } else {
        high = mid;
      }
      iterations++;
    }

    return {
      ...result,
      precioVenta: Math.round(mid * 100) / 100,
    };
  }

  // ─── calcBatch: all products margins ────────────────────────────

  async calcBatch(dto: {
    gatewaySlug: string;
    paymentMethod: string;
    withdrawalDays: number;
    installments: number;
    planSlug?: string;
  }): Promise<CalcBatchItem[]> {
    // Load TN config once (1 query via getAll)
    const config = await this.tiendanubeConfigService.getAll();

    // Load all product costs (2 queries via calculateAll)
    const costMap = await this.costsService.calculateAll();

    // Load all products with prices (2 queries via findAll)
    const products = await this.productsService.findAll();

    const results: CalcBatchItem[] = [];

    for (const product of products) {
      const costData = costMap.get(product.id);
      const cost = costData?.cost ?? 0;

      // CRITICAL: currentPrice is a STRING from TypeORM decimal column
      // parseFloat converts it to number. If null or invalid, skip.
      const currentPriceRaw = product.currentPrice;
      const currentPrice =
        currentPriceRaw !== null && currentPriceRaw !== undefined
          ? parseFloat(currentPriceRaw as string)
          : null;

      // Build display name: type + name + finish
      const productName = [
        product.type?.name,
        product.name?.name,
        product.finish?.name,
      ]
        .filter(Boolean)
        .join(' ');

      let calcResult: CalcResult | null = null;

      if (currentPrice !== null && !isNaN(currentPrice) && currentPrice > 0) {
        calcResult = this.calcForward({
          precioVenta: currentPrice,
          costoEnvio: 0, // batch mode: no shipping cost
          costoProducto: cost,
          gatewaySlug: dto.gatewaySlug,
          paymentMethod: dto.paymentMethod,
          withdrawalDays: dto.withdrawalDays,
          installments: dto.installments,
          planSlug: dto.planSlug,
          config,
        });
      }

      results.push({
        productId: product.id,
        productName,
        cost,
        currentPrice,
        result: calcResult,
      });
    }

    return results;
  }
}
