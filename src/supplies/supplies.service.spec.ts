import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { SuppliesService } from './supplies.service';
import { Supply } from './entities/supply.entity';
import { SupplyPriceHistory } from './entities/supply-price-history.entity';
import { SupplyType } from '../catalogs/entities/supply-type.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { SuppliesPerProductHistory } from '../products/entities/supplies-per-product-history.entity';

const SUPPLY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const TYPE_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const SUPPLIER_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

const mockSupplyType = { id: TYPE_ID, name: 'Cuero' } as SupplyType;
const mockActiveSupplier = {
  id: SUPPLIER_ID,
  name: 'Curtiembre XYZ',
  isActive: true,
} as Supplier;
const mockInactiveSupplier = {
  id: SUPPLIER_ID,
  name: 'Curtiembre Cerrada',
  isActive: false,
} as Supplier;

const mockManager = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockEntityManager = {
  transaction: jest
    .fn()
    .mockImplementation((cb: (m: typeof mockManager) => unknown) =>
      cb(mockManager),
    ),
};

const mockSupplyRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
  count: jest.fn(),
};
const mockPriceHistoryRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  query: jest.fn(),
};
const mockSupplyTypeRepo = { findOne: jest.fn() };
const mockSupplierRepo = { findOne: jest.fn() };
const mockBomRepo = {
  count: jest.fn(),
};

describe('SuppliesService', () => {
  let service: SuppliesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliesService,
        { provide: getRepositoryToken(Supply), useValue: mockSupplyRepo },
        {
          provide: getRepositoryToken(SupplyPriceHistory),
          useValue: mockPriceHistoryRepo,
        },
        {
          provide: getRepositoryToken(SupplyType),
          useValue: mockSupplyTypeRepo,
        },
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockSupplierRepo,
        },
        {
          provide: getRepositoryToken(SuppliesPerProductHistory),
          useValue: mockBomRepo,
        },
        { provide: EntityManager, useValue: mockEntityManager },
      ],
    }).compile();

    service = module.get<SuppliesService>(SuppliesService);
    jest.clearAllMocks();
    // Re-attach transaction mock after clearAllMocks wipes it
    mockEntityManager.transaction.mockImplementation(
      (cb: (m: typeof mockManager) => unknown) => cb(mockManager),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------
  // toggleStatus — guard conditions
  // ---------------------------------------------------------------
  describe('toggleStatus', () => {
    it('throws ConflictException when deactivating a supply that is in an active BOM', async () => {
      const activeSupply = {
        id: SUPPLY_ID,
        name: 'Cuero Marrón',
        isActive: true,
        supplier: mockActiveSupplier,
      } as Supply;
      mockSupplyRepo.findOne.mockResolvedValue(activeSupply);
      mockBomRepo.count.mockResolvedValue(2); // 2 products use this supply in active BOM

      await expect(service.toggleStatus(SUPPLY_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(mockBomRepo.count).toHaveBeenCalledWith({
        where: { supply: { id: SUPPLY_ID }, isActive: true },
      });
      expect(mockSupplyRepo.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when reactivating a supply whose supplier is inactive', async () => {
      const inactiveSupply = {
        id: SUPPLY_ID,
        name: 'Cuero Antiguo',
        isActive: false,
        supplier: mockInactiveSupplier,
      } as Supply;
      mockSupplyRepo.findOne.mockResolvedValue(inactiveSupply);

      await expect(service.toggleStatus(SUPPLY_ID)).rejects.toThrow(
        ConflictException,
      );
      // Should fail before even checking BOM
      expect(mockBomRepo.count).not.toHaveBeenCalled();
      expect(mockSupplyRepo.save).not.toHaveBeenCalled();
    });

    it('deactivates a supply that is not in any active BOM', async () => {
      const activeSupply = {
        id: SUPPLY_ID,
        name: 'Cuero Libre',
        isActive: true,
        supplier: mockActiveSupplier,
      } as Supply;
      const savedSupply = { ...activeSupply, isActive: false };
      mockSupplyRepo.findOne.mockResolvedValue(activeSupply);
      mockBomRepo.count.mockResolvedValue(0); // No active BOM usage
      mockSupplyRepo.save.mockResolvedValue(savedSupply);

      const result = await service.toggleStatus(SUPPLY_ID);

      expect(result.isActive).toBe(false);
      expect(mockSupplyRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('throws NotFoundException when supply does not exist', async () => {
      mockSupplyRepo.findOne.mockResolvedValue(null);

      await expect(service.toggleStatus(SUPPLY_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------
  // create — with and without initialPrice (transaction path)
  // ---------------------------------------------------------------
  describe('create', () => {
    const baseDto = {
      name: 'Cuero Vacuno Marrón',
      typeId: TYPE_ID,
      supplierId: SUPPLIER_ID,
      unitType: 'm2' as const,
    };

    it('creates supply + price atomically when initialPrice is provided', async () => {
      const dto = { ...baseDto, initialPrice: 1500 };
      mockSupplyTypeRepo.findOne.mockResolvedValue(mockSupplyType);
      mockSupplierRepo.findOne.mockResolvedValue(mockActiveSupplier);

      const savedSupply = {
        id: SUPPLY_ID,
        name: dto.name,
        type: mockSupplyType,
        supplier: mockActiveSupplier,
        isActive: true,
      } as Supply;
      const savedPrice = {
        id: 'price-uuid',
        price: '1500',
        createdAt: new Date(),
      } as SupplyPriceHistory;

      mockManager.create
        .mockReturnValueOnce(savedSupply) // create Supply
        .mockReturnValueOnce(savedPrice); // create SupplyPriceHistory
      mockManager.save
        .mockResolvedValueOnce(savedSupply) // save Supply
        .mockResolvedValueOnce(savedPrice); // save SupplyPriceHistory

      const result = await service.create(dto);

      expect(mockEntityManager.transaction).toHaveBeenCalled();
      expect(result.currentPrice).toBe('1500');
      expect(result.id).toBe(SUPPLY_ID);
    });

    it('creates supply only (without price) when initialPrice is absent', async () => {
      mockSupplyTypeRepo.findOne.mockResolvedValue(mockSupplyType);
      mockSupplierRepo.findOne.mockResolvedValue(mockActiveSupplier);

      const savedSupply = {
        id: SUPPLY_ID,
        name: baseDto.name,
        type: mockSupplyType,
        supplier: mockActiveSupplier,
        isActive: true,
      } as Supply;

      mockSupplyRepo.create.mockReturnValue(savedSupply);
      mockSupplyRepo.save.mockResolvedValue(savedSupply);

      const result = await service.create(baseDto);

      // Transaction should NOT be used for supply-only creation
      expect(mockEntityManager.transaction).not.toHaveBeenCalled();
      expect(result.currentPrice).toBeNull();
      expect(result.id).toBe(SUPPLY_ID);
    });

    it('throws NotFoundException when supply type does not exist', async () => {
      mockSupplyTypeRepo.findOne.mockResolvedValue(null);

      await expect(service.create(baseDto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when supplier does not exist', async () => {
      mockSupplyTypeRepo.findOne.mockResolvedValue(mockSupplyType);
      mockSupplierRepo.findOne.mockResolvedValue(null);

      await expect(service.create(baseDto)).rejects.toThrow(NotFoundException);
    });
  });
});
