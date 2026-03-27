import { Injectable } from '@nestjs/common';
import {
  TiendanubeConfigService,
  TiendanubeConfigAll,
} from '../tiendanube-config/tiendanube-config.service';
import { CostsService } from '../costs/costs.service';
import { ProductsService } from '../products/products.service';
import {
  CalcResult,
  CalcInverseResult,
  CalcBatchItem,
  CalcError,
} from './dto/calc-result.dto';

@Injectable()
export class CalculadoraService {
  constructor(
    private readonly tiendanubeConfigService: TiendanubeConfigService,
    private readonly costsService: CostsService,
    private readonly productsService: ProductsService,
  ) {}

  // TODO: implement
  calcForward(_params: {
    precioVenta: number;
    costoEnvio: number;
    costoProducto: number;
    gatewaySlug: string;
    paymentMethod: string;
    withdrawalDays: number;
    installments: number;
    planSlug?: string;
    config: TiendanubeConfigAll;
  }): CalcResult {
    throw new Error('Not implemented');
  }

  // TODO: implement
  calcInverse(_params: {
    gananciaDeseada: number;
    costoEnvio: number;
    costoProducto: number;
    gatewaySlug: string;
    paymentMethod: string;
    withdrawalDays: number;
    installments: number;
    planSlug?: string;
    config: TiendanubeConfigAll;
  }): CalcInverseResult | CalcError {
    throw new Error('Not implemented');
  }

  // TODO: implement
  async calcBatch(_dto: {
    gatewaySlug: string;
    paymentMethod: string;
    withdrawalDays: number;
    installments: number;
    planSlug?: string;
  }): Promise<CalcBatchItem[]> {
    throw new Error('Not implemented');
  }
}
