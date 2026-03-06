import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SuppliesPerProductHistory } from '../products/entities/supplies-per-product-history.entity';
import { SupplyPriceHistory } from '../supplies/entities/supply-price-history.entity';
import { CostsService } from './costs.service';

describe('CostsService', () => {
  let service: CostsService;

  const mockBomRepo = {
    find: jest.fn(),
  };

  const mockPriceHistoryRepo = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostsService,
        {
          provide: getRepositoryToken(SuppliesPerProductHistory),
          useValue: mockBomRepo,
        },
        {
          provide: getRepositoryToken(SupplyPriceHistory),
          useValue: mockPriceHistoryRepo,
        },
      ],
    }).compile();

    service = module.get<CostsService>(CostsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateAll', () => {
    it('should calculate correct total cost for product with 2 BOM items', async () => {
      const productId = 'prod-1';
      const supply1Id = 'supply-1';
      const supply2Id = 'supply-2';

      mockBomRepo.find.mockResolvedValue([
        {
          product: { id: productId },
          supply: {
            id: supply1Id,
            name: 'Cuero Vaqueta',
            type: { name: 'Cuero' },
            unitType: 'm2',
            isActive: true,
          },
          quantity: '0.50',
          isActive: true,
        },
        {
          product: { id: productId },
          supply: {
            id: supply2Id,
            name: 'Cierre YKK',
            type: { name: 'Herraje' },
            unitType: 'unidad',
            isActive: true,
          },
          quantity: '2',
          isActive: true,
        },
      ]);

      mockPriceHistoryRepo.query.mockResolvedValue([
        { supply_id: supply1Id, price: '5000.00' },
        { supply_id: supply2Id, price: '300.00' },
      ]);

      const result = await service.calculateAll();

      expect(result.has(productId)).toBe(true);
      const costData = result.get(productId)!;
      // 0.50 * 5000 + 2 * 300 = 2500 + 600 = 3100
      expect(costData.cost).toBe(3100);
      expect(costData.costBreakdown).toHaveLength(2);
      expect(costData.costWarnings).toHaveLength(0);
    });

    it('should return no entry for product without BOM', async () => {
      mockBomRepo.find.mockResolvedValue([]);
      mockPriceHistoryRepo.query.mockResolvedValue([]);

      const result = await service.calculateAll();

      expect(result.size).toBe(0);
    });

    it('should return partial cost and warning when supply has no price history', async () => {
      const productId = 'prod-1';
      const supply1Id = 'supply-1';
      const supply2Id = 'supply-2';

      mockBomRepo.find.mockResolvedValue([
        {
          product: { id: productId },
          supply: {
            id: supply1Id,
            name: 'Cuero Vaqueta',
            type: { name: 'Cuero' },
            unitType: 'm2',
            isActive: true,
          },
          quantity: '0.50',
          isActive: true,
        },
        {
          product: { id: productId },
          supply: {
            id: supply2Id,
            name: 'Hilo Encerado',
            type: { name: 'Insumo' },
            unitType: 'metro',
            isActive: true,
          },
          quantity: '3',
          isActive: true,
        },
      ]);

      // Only supply1 has price, supply2 does not
      mockPriceHistoryRepo.query.mockResolvedValue([
        { supply_id: supply1Id, price: '5000.00' },
      ]);

      const result = await service.calculateAll();
      const costData = result.get(productId)!;

      // Only 0.50 * 5000 = 2500 (hilo has no price)
      expect(costData.cost).toBe(2500);
      expect(costData.costWarnings).toContainEqual(
        expect.stringContaining('Hilo Encerado sin precio'),
      );
    });

    it('should include inactive supply cost and add warning', async () => {
      const productId = 'prod-1';
      const supplyId = 'supply-1';

      mockBomRepo.find.mockResolvedValue([
        {
          product: { id: productId },
          supply: {
            id: supplyId,
            name: 'Cierre Viejo',
            type: { name: 'Herraje' },
            unitType: 'unidad',
            isActive: false,
          },
          quantity: '1',
          isActive: true,
        },
      ]);

      mockPriceHistoryRepo.query.mockResolvedValue([
        { supply_id: supplyId, price: '450.00' },
      ]);

      const result = await service.calculateAll();
      const costData = result.get(productId)!;

      expect(costData.cost).toBe(450);
      expect(costData.costWarnings).toContainEqual(
        expect.stringContaining('Cierre Viejo inactivo'),
      );
    });

    it('should round decimal costs to 2 decimal places', async () => {
      const productId = 'prod-1';
      const supplyId = 'supply-1';

      mockBomRepo.find.mockResolvedValue([
        {
          product: { id: productId },
          supply: {
            id: supplyId,
            name: 'Cuero Premium',
            type: { name: 'Cuero' },
            unitType: 'm2',
            isActive: true,
          },
          quantity: '0.33',
          isActive: true,
        },
      ]);

      mockPriceHistoryRepo.query.mockResolvedValue([
        { supply_id: supplyId, price: '3741.23' },
      ]);

      const result = await service.calculateAll();
      const costData = result.get(productId)!;

      // 0.33 * 3741.23 = 1234.6059 -> rounds to 1234.61
      expect(costData.cost).toBe(1234.61);
    });
  });

  describe('calculateForProduct', () => {
    it('should return cost data for a single product', async () => {
      const productId = 'prod-1';
      const supplyId = 'supply-1';

      mockBomRepo.find.mockResolvedValue([
        {
          product: { id: productId },
          supply: {
            id: supplyId,
            name: 'Cuero Vaqueta',
            type: { name: 'Cuero' },
            unitType: 'm2',
            isActive: true,
          },
          quantity: '0.50',
          isActive: true,
        },
      ]);

      mockPriceHistoryRepo.query.mockResolvedValue([
        { supply_id: supplyId, price: '5000.00' },
      ]);

      const result = await service.calculateForProduct(productId);

      expect(result).not.toBeNull();
      expect(result!.cost).toBe(2500);
      expect(result!.costBreakdown).toHaveLength(1);
    });

    it('should return null for product without BOM', async () => {
      mockBomRepo.find.mockResolvedValue([]);

      const result = await service.calculateForProduct('non-existent');

      expect(result).toBeNull();
    });
  });
});
