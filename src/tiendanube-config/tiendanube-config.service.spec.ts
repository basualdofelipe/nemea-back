import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TiendanubeConfigService } from './tiendanube-config.service';
import { TnPaymentGateway } from './entities/tn-payment-gateway.entity';
import { TnGatewayRate } from './entities/tn-gateway-rate.entity';
import { TnInstallmentRate } from './entities/tn-installment-rate.entity';
import { TnTaxConfig } from './entities/tn-tax-config.entity';
import { TnPlan } from './entities/tn-plan.entity';

const GATEWAY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const RATE_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const TAX_CONFIG_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

const mockGateway = {
  id: GATEWAY_ID,
  slug: 'pago_nube',
  label: 'Pago Nube',
  isActive: true,
} as TnPaymentGateway;

// NOTE: No EntityManager — TiendanubeConfigService only injects 5 repos
const mockGatewayRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  query: jest.fn(),
};
const mockGatewayRateRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  query: jest.fn(),
};
const mockInstallmentRateRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  query: jest.fn(),
};
const mockTaxConfigRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockPlanRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
};

describe('TiendanubeConfigService', () => {
  let service: TiendanubeConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiendanubeConfigService,
        {
          provide: getRepositoryToken(TnPaymentGateway),
          useValue: mockGatewayRepo,
        },
        {
          provide: getRepositoryToken(TnGatewayRate),
          useValue: mockGatewayRateRepo,
        },
        {
          provide: getRepositoryToken(TnInstallmentRate),
          useValue: mockInstallmentRateRepo,
        },
        {
          provide: getRepositoryToken(TnTaxConfig),
          useValue: mockTaxConfigRepo,
        },
        {
          provide: getRepositoryToken(TnPlan),
          useValue: mockPlanRepo,
        },
      ],
    }).compile();

    service = module.get<TiendanubeConfigService>(TiendanubeConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------
  // updateGatewayRate — NotFoundException + string→number parsing
  // ---------------------------------------------------------------
  describe('updateGatewayRate', () => {
    it('throws NotFoundException when gateway is not found', async () => {
      mockGatewayRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateGatewayRate(GATEWAY_ID, {
          paymentMethod: 'tarjeta_debito_credito',
          withdrawalDays: 1,
          ratePercent: 2.5,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockGatewayRateRepo.save).not.toHaveBeenCalled();
    });

    it('parses ratePercent string to number and appends a new rate record', async () => {
      mockGatewayRepo.findOne.mockResolvedValue(mockGateway);

      const rawRate = {
        id: RATE_ID,
        gateway: mockGateway,
        paymentMethod: 'tarjeta_debito_credito',
        withdrawalDays: 1,
        ratePercent: '2.5', // TypeORM returns DECIMAL as string
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as TnGatewayRate;

      mockGatewayRateRepo.create.mockReturnValue(rawRate);
      mockGatewayRateRepo.save.mockResolvedValue(rawRate);

      const result = await service.updateGatewayRate(GATEWAY_ID, {
        paymentMethod: 'tarjeta_debito_credito',
        withdrawalDays: 1,
        ratePercent: 2.5,
      });

      // parseGatewayRate converts string → number
      expect(typeof result.ratePercent).toBe('number');
      expect(result.ratePercent).toBe(2.5);
      // A new record was appended (save was called)
      expect(mockGatewayRateRepo.save).toHaveBeenCalledWith(rawRate);
    });
  });

  // ---------------------------------------------------------------
  // getTaxConfig — returns null when no active config exists
  // ---------------------------------------------------------------
  describe('getTaxConfig', () => {
    it('returns null when no active tax config exists', async () => {
      mockTaxConfigRepo.findOne.mockResolvedValue(null);

      const result = await service.getTaxConfig();

      expect(result).toBeNull();
      expect(mockTaxConfigRepo.findOne).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('returns parsed tax config with numeric ivaRate and iibbRate when active config exists', async () => {
      const rawConfig = {
        id: TAX_CONFIG_ID,
        ivaRate: '21', // TypeORM DECIMAL as string
        iibbRate: '3.5',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as TnTaxConfig;
      mockTaxConfigRepo.findOne.mockResolvedValue(rawConfig);

      const result = await service.getTaxConfig();

      expect(result).not.toBeNull();
      expect(typeof result!.ivaRate).toBe('number');
      expect(result!.ivaRate).toBe(21);
      expect(typeof result!.iibbRate).toBe('number');
      expect(result!.iibbRate).toBe(3.5);
    });
  });

  // ---------------------------------------------------------------
  // updateTaxConfig — append-only, prior record untouched
  // ---------------------------------------------------------------
  describe('updateTaxConfig', () => {
    it('appends a new tax config record without modifying any prior record', async () => {
      const newConfig = {
        id: TAX_CONFIG_ID,
        ivaRate: '21',
        iibbRate: '3.5',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as TnTaxConfig;

      mockTaxConfigRepo.create.mockReturnValue(newConfig);
      mockTaxConfigRepo.save.mockResolvedValue(newConfig);

      const result = await service.updateTaxConfig({
        ivaRate: 21,
        iibbRate: 3.5,
      });

      // A new record was created (not updated — append-only)
      expect(mockTaxConfigRepo.create).toHaveBeenCalledWith({
        ivaRate: '21',
        iibbRate: '3.5',
      });
      expect(mockTaxConfigRepo.save).toHaveBeenCalledWith(newConfig);
      // Result has numeric parsed values
      expect(result.ivaRate).toBe(21);
      expect(result.iibbRate).toBe(3.5);
    });
  });
});
