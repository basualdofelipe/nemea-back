import { Test, TestingModule } from '@nestjs/testing';
import { CalculadoraService } from './calculadora.service';
import {
  TiendanubeConfigService,
  TiendanubeConfigAll,
} from '../tiendanube-config/tiendanube-config.service';
import { CostsService } from '../costs/costs.service';
import {
  ProductsService,
  ProductWithPrice,
} from '../products/products.service';
import { CalcResult, CalcError, CalcBatchItem } from './dto/calc-result.dto';
import { ProductCostData } from '../costs/dto/product-with-cost.dto';

// ─── Mock data matching REAL runtime shapes (including bugs) ──────────

const GATEWAY_UUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const mockConfig: TiendanubeConfigAll = {
  gateways: [
    {
      id: GATEWAY_UUID,
      slug: 'pago_nube',
      label: 'Pago Nube',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TiendanubeConfigAll['gateways'][number],
  ],
  rates: [
    {
      // Real raw SQL output: snake_case field names
      gateway: {
        id: GATEWAY_UUID,
        slug: 'pago_nube',
        label: 'Pago Nube',
        is_active: true,
      },
      payment_method: 'tarjeta_debito_credito',
      withdrawal_days: 14,
      rate_percent: '3.49', // STRING from raw SQL -- the REAL value
      ratePercent: NaN, // BROKEN -- parseGatewayRate produces NaN
    } as unknown as TiendanubeConfigAll['rates'][number],
    {
      gateway: {
        id: GATEWAY_UUID,
        slug: 'pago_nube',
        label: 'Pago Nube',
        is_active: true,
      },
      payment_method: 'transferencia',
      withdrawal_days: 0,
      rate_percent: '1.50',
      ratePercent: NaN,
    } as unknown as TiendanubeConfigAll['rates'][number],
  ],
  installments: [
    {
      installments: 1,
      rate_percent: '0.00', // STRING from raw SQL
      ratePercent: NaN, // BROKEN
    } as unknown as TiendanubeConfigAll['installments'][number],
    {
      installments: 3,
      rate_percent: '8.42',
      ratePercent: NaN,
    } as unknown as TiendanubeConfigAll['installments'][number],
  ],
  taxConfig: {
    ivaRate: 21, // Number, correct -- but PERCENTAGE not fraction
    iibbRate: 3.5, // Number, correct -- but PERCENTAGE not fraction
  } as TiendanubeConfigAll['taxConfig'],
  plans: [
    {
      slug: 'esencial',
      label: 'Esencial',
      cptPagoNube: 0,
      cptOtherGateways: 1.5,
      isActive: true,
      onlyPagoNube: false,
    } as unknown as TiendanubeConfigAll['plans'][number],
  ],
};

describe('CalculadoraService', () => {
  let service: CalculadoraService;
  let _tiendanubeConfigService: jest.Mocked<TiendanubeConfigService>;
  let costsService: jest.Mocked<CostsService>;
  let productsService: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculadoraService,
        {
          provide: TiendanubeConfigService,
          useValue: {
            getAll: jest.fn().mockResolvedValue(mockConfig),
          },
        },
        {
          provide: CostsService,
          useValue: {
            calculateAll: jest.fn(),
            calculateForProduct: jest.fn(),
          },
        },
        {
          provide: ProductsService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CalculadoraService>(CalculadoraService);
    _tiendanubeConfigService = module.get(TiendanubeConfigService);
    costsService = module.get(CostsService);
    productsService = module.get(ProductsService);
  });

  // ─── Test 1: calcForward with Hefesto $87,000 ────────────────────

  it('calcForward with Hefesto at $87,000 produces correct desglose', () => {
    const result: CalcResult = service.calcForward({
      precioVenta: 87000,
      costoEnvio: 7315,
      costoProducto: 6534.48,
      gatewaySlug: 'pago_nube',
      paymentMethod: 'tarjeta_debito_credito',
      withdrawalDays: 14,
      installments: 1,
      planSlug: 'esencial',
      config: mockConfig,
    });

    // totalCliente = 87000 + 7315 = 94315
    expect(result.totalCliente).toBe(94315);

    // tasaBase = 3.49 (from plan esencial, tarjeta, 14d)
    expect(result.tasaBase).toBeCloseTo(3.49, 2);

    // tasaConIVA = 3.49 * (1 + 0.21) = 4.2229
    expect(result.tasaConIVA).toBeCloseTo(4.2229, 3);

    // comisionPasarela = 94315 * (4.2229 / 100) = ~3,982.88
    expect(result.comisionPasarela).toBeGreaterThan(3900);
    expect(result.comisionPasarela).toBeLessThan(4100);

    // CPT for pago_nube on plan esencial = 0%
    expect(result.cpt).toBe(0);

    // gananciaReal should be positive and reasonable
    expect(result.gananciaReal).toBeGreaterThan(0);

    // margen should be a positive percentage
    expect(result.margen).toBeGreaterThan(0);
    expect(result.margen).toBeLessThan(100);

    // All 16 fields should exist
    expect(result).toHaveProperty('totalCliente');
    expect(result).toHaveProperty('tasaBase');
    expect(result).toHaveProperty('tasaConIVA');
    expect(result).toHaveProperty('comisionPasarela');
    expect(result).toHaveProperty('tasaCuotas');
    expect(result).toHaveProperty('costoFinanciacion');
    expect(result).toHaveProperty('cpt');
    expect(result).toHaveProperty('baseGravada');
    expect(result).toHaveProperty('ivaDebito');
    expect(result).toHaveProperty('ivaCreditoProducto');
    expect(result).toHaveProperty('ivaCreditoComision');
    expect(result).toHaveProperty('ivaNeto');
    expect(result).toHaveProperty('retencionIIBB');
    expect(result).toHaveProperty('netoRecibido');
    expect(result).toHaveProperty('costoProductoConIVA');
    expect(result).toHaveProperty('gananciaReal');
    expect(result).toHaveProperty('margen');
  });

  // ─── Test 2: calcInverse round-trip ──────────────────────────────

  it('calcInverse round-trips within $0.01 of original price', () => {
    // Step 1: calcForward to get gananciaReal at $87,000
    const forwardResult = service.calcForward({
      precioVenta: 87000,
      costoEnvio: 7315,
      costoProducto: 6534.48,
      gatewaySlug: 'pago_nube',
      paymentMethod: 'tarjeta_debito_credito',
      withdrawalDays: 14,
      installments: 1,
      planSlug: 'esencial',
      config: mockConfig,
    });

    // Step 2: calcInverse with that gananciaReal to recover the selling price
    const inverseResult = service.calcInverse({
      gananciaDeseada: forwardResult.gananciaReal,
      costoEnvio: 7315,
      costoProducto: 6534.48,
      gatewaySlug: 'pago_nube',
      paymentMethod: 'tarjeta_debito_credito',
      withdrawalDays: 14,
      installments: 1,
      planSlug: 'esencial',
      config: mockConfig,
    });

    // Should not be an error
    expect((inverseResult as CalcError).error).toBeUndefined();

    // The recovered price should be within $0.01 of 87000
    const result = inverseResult as { precioVenta: number };
    expect(Math.abs(result.precioVenta - 87000)).toBeLessThanOrEqual(0.01);
  });

  // ─── Test 3: calcInverse with zero cost ──────────────────────────

  it('calcInverse returns error when costoProducto is 0', () => {
    const result = service.calcInverse({
      gananciaDeseada: 50000,
      costoEnvio: 7315,
      costoProducto: 0,
      gatewaySlug: 'pago_nube',
      paymentMethod: 'tarjeta_debito_credito',
      withdrawalDays: 14,
      installments: 1,
      planSlug: 'esencial',
      config: mockConfig,
    });

    expect((result as CalcError).error).toBe(true);
    expect((result as CalcError).message).toBe(
      'Defini el costo del producto primero',
    );
  });

  // ─── Test 4: calcInverse with negative gananciaDeseada ───────────

  it('calcInverse returns error when gananciaDeseada is negative', () => {
    const result = service.calcInverse({
      gananciaDeseada: -5000,
      costoEnvio: 7315,
      costoProducto: 6534.48,
      gatewaySlug: 'pago_nube',
      paymentMethod: 'tarjeta_debito_credito',
      withdrawalDays: 14,
      installments: 1,
      planSlug: 'esencial',
      config: mockConfig,
    });

    expect((result as CalcError).error).toBe(true);
    expect((result as CalcError).message).toBe(
      'La ganancia deseada debe ser positiva',
    );
  });

  // ─── Test 5: calcInverse with unreachable target ─────────────────

  it('calcInverse returns error when target profit is unreachable', () => {
    const result = service.calcInverse({
      gananciaDeseada: 10_000_000,
      costoEnvio: 0,
      costoProducto: 100,
      gatewaySlug: 'pago_nube',
      paymentMethod: 'tarjeta_debito_credito',
      withdrawalDays: 14,
      installments: 1,
      planSlug: 'esencial',
      config: mockConfig,
    });

    expect((result as CalcError).error).toBe(true);
    expect((result as CalcError).message).toBe(
      'Ganancia inalcanzable con estas tasas',
    );
  });

  // ─── Test 6: calcBatch with string currentPrice (TypeORM decimal) ─

  it('calcBatch correctly parses string currentPrice and returns results', async () => {
    const productIds = [
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
    ];

    // Mock ProductsService.findAll() -- currentPrice is STRING (TypeORM decimal)
    productsService.findAll.mockResolvedValue([
      {
        id: productIds[0],
        type: { name: 'Billetera' },
        name: { name: 'Hefesto' },
        finish: { name: 'Lisa' },
        currentPrice: '87000.00', // STRING from TypeORM
        lastPriceUpdate: new Date(),
      } as unknown as ProductWithPrice,
      {
        id: productIds[1],
        type: { name: 'Cinturon' },
        name: { name: 'Ares' },
        finish: { name: 'Grabada' },
        currentPrice: '45000.00', // STRING
        lastPriceUpdate: new Date(),
      } as unknown as ProductWithPrice,
      {
        id: productIds[2],
        type: { name: 'Bolso' },
        name: { name: 'Atenea' },
        finish: { name: 'Lisa' },
        currentPrice: '120000.00', // STRING
        lastPriceUpdate: new Date(),
      } as unknown as ProductWithPrice,
    ]);

    // Mock CostsService.calculateAll()
    const costMap = new Map<string, ProductCostData>();
    costMap.set(productIds[0], {
      cost: 6534.48,
      costBreakdown: [],
      costWarnings: [],
    });
    costMap.set(productIds[1], {
      cost: 3200,
      costBreakdown: [],
      costWarnings: [],
    });
    costMap.set(productIds[2], {
      cost: 9800,
      costBreakdown: [],
      costWarnings: [],
    });
    costsService.calculateAll.mockResolvedValue(costMap);

    const results: CalcBatchItem[] = await service.calcBatch({
      gatewaySlug: 'pago_nube',
      paymentMethod: 'tarjeta_debito_credito',
      withdrawalDays: 14,
      installments: 1,
      planSlug: 'esencial',
    });

    expect(results).toHaveLength(3);

    // Verify currentPrice is a NUMBER, not a string
    for (const item of results) {
      expect(typeof item.currentPrice).toBe('number');
      expect(item.result).not.toBeNull();
      if (item.result) {
        expect(item.result.gananciaReal).toBeGreaterThan(0);
        expect(item.result.margen).toBeGreaterThan(0);
      }
    }

    // First product should be Hefesto
    expect(results[0].productName).toContain('Hefesto');
    expect(results[0].currentPrice).toBe(87000);
    expect(results[0].cost).toBe(6534.48);
  });
});
