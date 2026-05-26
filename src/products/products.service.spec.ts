import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { SuppliesPerProductHistory } from './entities/supplies-per-product-history.entity';
import { ProductPriceHistory } from './entities/product-price-history.entity';
import { ProductType } from '../catalogs/entities/product-type.entity';
import { ProductName } from '../catalogs/entities/product-name.entity';
import { ProductFinish } from '../catalogs/entities/product-finish.entity';
import { ProductColor } from '../catalogs/entities/product-color.entity';
import { ProductSize } from '../catalogs/entities/product-size.entity';
import { Supply } from '../supplies/entities/supply.entity';

const PRODUCT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const TYPE_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const NAME_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const FINISH_ID = 'd4e5f6a7-b8c9-0123-defa-234567890123';
const COLOR_ID = 'e5f6a7b8-c9d0-1234-efab-345678901234';
const SIZE_ID = 'f6a7b8c9-d0e1-2345-fabc-456789012345';
const SUPPLY_ID = 'a7b8c9d0-e1f2-3456-abcd-567890123456';

const mockProductType = { id: TYPE_ID, skuCode: 'BIL' } as ProductType;
const mockProductName = { id: NAME_ID, skuCode: 'HEF' } as ProductName;
const mockProductFinish = { id: FINISH_ID, skuCode: 'LIS' } as ProductFinish;
const mockProductColor = { id: COLOR_ID, skuCode: 'MAR' } as ProductColor;
const mockProductSize = { id: SIZE_ID, skuCode: 'U' } as ProductSize;

const mockManager = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockEntityManager = {
  transaction: jest
    .fn()
    .mockImplementation((cb: (m: typeof mockManager) => unknown) =>
      cb(mockManager),
    ),
};

const mockProductRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockBomRepo = {
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};
const mockPriceHistoryRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  query: jest.fn(),
};
const mockProductTypeRepo = { findOne: jest.fn() };
const mockProductNameRepo = { findOne: jest.fn() };
const mockProductFinishRepo = { findOne: jest.fn() };
const mockProductColorRepo = { findOne: jest.fn() };
const mockProductSizeRepo = { findOne: jest.fn() };
const mockSupplyRepo = { findOne: jest.fn(), find: jest.fn() };

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        {
          provide: getRepositoryToken(SuppliesPerProductHistory),
          useValue: mockBomRepo,
        },
        {
          provide: getRepositoryToken(ProductPriceHistory),
          useValue: mockPriceHistoryRepo,
        },
        {
          provide: getRepositoryToken(ProductType),
          useValue: mockProductTypeRepo,
        },
        {
          provide: getRepositoryToken(ProductName),
          useValue: mockProductNameRepo,
        },
        {
          provide: getRepositoryToken(ProductFinish),
          useValue: mockProductFinishRepo,
        },
        {
          provide: getRepositoryToken(ProductColor),
          useValue: mockProductColorRepo,
        },
        {
          provide: getRepositoryToken(ProductSize),
          useValue: mockProductSizeRepo,
        },
        { provide: getRepositoryToken(Supply), useValue: mockSupplyRepo },
        { provide: EntityManager, useValue: mockEntityManager },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
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
  // create — SKU generation and conflict detection
  // ---------------------------------------------------------------
  describe('create', () => {
    const createDto = {
      typeId: TYPE_ID,
      nameId: NAME_ID,
      finishId: FINISH_ID,
      colorId: COLOR_ID,
      sizeId: SIZE_ID,
    };

    it('generates correct SKU from catalog parts (type.skuCode + name + finish + color + size)', async () => {
      mockProductTypeRepo.findOne.mockResolvedValue(mockProductType);
      mockProductNameRepo.findOne.mockResolvedValue(mockProductName);
      mockProductFinishRepo.findOne.mockResolvedValue(mockProductFinish);
      mockProductColorRepo.findOne.mockResolvedValue(mockProductColor);
      mockProductSizeRepo.findOne.mockResolvedValue(mockProductSize);

      const expectedSkuCode = 'BIL.HEF.LIS.MAR.U';
      const savedProduct = {
        id: PRODUCT_ID,
        skuCode: expectedSkuCode,
      } as Product;
      mockProductRepo.create.mockReturnValue(savedProduct);
      mockProductRepo.save.mockResolvedValue(savedProduct);

      const result = await service.create(createDto);

      expect(result.skuCode).toBe(expectedSkuCode);
      expect(mockProductRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ skuCode: expectedSkuCode }),
      );
    });

    it('throws ConflictException on 23505 unique-violation (duplicate SKU)', async () => {
      mockProductTypeRepo.findOne.mockResolvedValue(mockProductType);
      mockProductNameRepo.findOne.mockResolvedValue(mockProductName);
      mockProductFinishRepo.findOne.mockResolvedValue(mockProductFinish);
      mockProductColorRepo.findOne.mockResolvedValue(mockProductColor);
      mockProductSizeRepo.findOne.mockResolvedValue(mockProductSize);

      const expectedSkuCode = 'BIL.HEF.LIS.MAR.U';
      const productEntity = {
        id: PRODUCT_ID,
        skuCode: expectedSkuCode,
      } as Product;
      mockProductRepo.create.mockReturnValue(productEntity);

      const dbError = Object.assign(
        new QueryFailedError(
          'INSERT INTO products',
          [],
          new Error('duplicate key'),
        ),
        { code: '23505' },
      );
      mockProductRepo.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws NotFoundException when a catalog dimension is not found', async () => {
      mockProductTypeRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------
  // updateBom — active-record swap and inactive-supply rejection
  // ---------------------------------------------------------------
  describe('updateBom', () => {
    const activeSupply = {
      id: SUPPLY_ID,
      name: 'Cuero Marrón',
      isActive: true,
    } as Supply;

    it('deactivates old BOM entries and inserts new active ones', async () => {
      const product = { id: PRODUCT_ID } as Product;
      const newEntry = {
        product: { id: PRODUCT_ID },
        supply: { id: SUPPLY_ID },
        isActive: true,
      };
      const savedEntry = {
        ...newEntry,
        id: 'bom-uuid',
      } as unknown as SuppliesPerProductHistory;

      mockManager.findOne.mockResolvedValue(product);
      mockManager.find.mockImplementation((entity: unknown) => {
        if (entity === Supply) return Promise.resolve([activeSupply]);
        return Promise.resolve([savedEntry]);
      });
      mockManager.create.mockReturnValue(newEntry);
      mockManager.save.mockResolvedValue([savedEntry]);
      mockManager.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateBom(PRODUCT_ID, {
        items: [{ supplyId: SUPPLY_ID, quantity: 0.5 }],
      });

      // manager.update was called to deactivate old BOM entries
      expect(mockManager.update).toHaveBeenCalledWith(
        SuppliesPerProductHistory,
        { product: { id: PRODUCT_ID }, isActive: true },
        { isActive: false },
      );
      // New entries were saved
      expect(mockManager.save).toHaveBeenCalled();
      // Result is an array (BOM entries)
      expect(Array.isArray(result)).toBe(true);
    });

    it('throws ConflictException when a referenced supply is inactive', async () => {
      const inactiveSupply = {
        id: SUPPLY_ID,
        name: 'Cuero Roto',
        isActive: false,
      } as Supply;
      const product = { id: PRODUCT_ID } as Product;

      mockManager.findOne.mockResolvedValue(product);
      mockManager.find.mockImplementation((entity: unknown) => {
        if (entity === Supply) return Promise.resolve([inactiveSupply]);
        return Promise.resolve([]);
      });

      await expect(
        service.updateBom(PRODUCT_ID, {
          items: [{ supplyId: SUPPLY_ID, quantity: 0.5 }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when a referenced supply does not exist', async () => {
      const product = { id: PRODUCT_ID } as Product;
      const MISSING_SUPPLY_ID = 'ffffffff-ffff-4fff-bfff-ffffffffffff';

      mockManager.findOne.mockResolvedValue(product);
      // Return empty array — supply not found
      mockManager.find.mockImplementation((entity: unknown) => {
        if (entity === Supply) return Promise.resolve([]);
        return Promise.resolve([]);
      });

      await expect(
        service.updateBom(PRODUCT_ID, {
          items: [{ supplyId: MISSING_SUPPLY_ID, quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deactivates all BOM entries and returns empty when items is empty', async () => {
      const product = { id: PRODUCT_ID } as Product;

      mockManager.findOne.mockResolvedValue(product);
      mockManager.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateBom(PRODUCT_ID, { items: [] });

      expect(mockManager.update).toHaveBeenCalledWith(
        SuppliesPerProductHistory,
        { product: { id: PRODUCT_ID }, isActive: true },
        { isActive: false },
      );
      expect(result).toEqual([]);
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(
        service.updateBom(PRODUCT_ID, { items: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------
  // addPrice — append-only to price history
  // ---------------------------------------------------------------
  describe('addPrice', () => {
    it('appends a new price-history record without modifying existing ones', async () => {
      const product = { id: PRODUCT_ID } as Product;
      const priceRecord = {
        id: 'price-uuid',
        product,
        price: '1500',
        createdAt: new Date(),
      } as ProductPriceHistory;

      mockProductRepo.findOne.mockResolvedValue(product);
      mockPriceHistoryRepo.create.mockReturnValue(priceRecord);
      mockPriceHistoryRepo.save.mockResolvedValue(priceRecord);

      const result = await service.addPrice(PRODUCT_ID, { price: 1500 });

      expect(result.price).toBe('1500');
      expect(mockPriceHistoryRepo.create).toHaveBeenCalledWith({
        product,
        price: '1500',
      });
      expect(mockPriceHistoryRepo.save).toHaveBeenCalledWith(priceRecord);
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addPrice(PRODUCT_ID, { price: 1500 }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPriceHistoryRepo.save).not.toHaveBeenCalled();
    });
  });
});
