import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { ProductColor } from './entities/product-color.entity';
import { ProductFinish } from './entities/product-finish.entity';
import { ProductName } from './entities/product-name.entity';
import { ProductSize } from './entities/product-size.entity';
import { ProductType } from './entities/product-type.entity';
import { SupplyType } from './entities/supply-type.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import { BaseEntity } from '../common/entities/base.entity';

type CatalogEntity = BaseEntity & { name: string };

const VALID_DIMENSIONS = [
  'product-types',
  'product-names',
  'product-finishes',
  'product-colors',
  'product-sizes',
  'supply-types',
  'expense-categories',
] as const;

export type CatalogDimension = (typeof VALID_DIMENSIONS)[number];

@Injectable()
export class CatalogsService {
  private readonly DIMENSIONS_WITH_SKU: ReadonlySet<string> = new Set([
    'product-types',
    'product-names',
    'product-finishes',
    'product-colors',
    'product-sizes',
  ]);

  private readonly dimensionMap: Record<
    CatalogDimension,
    Repository<CatalogEntity>
  >;

  constructor(
    @InjectRepository(ProductType)
    private readonly productTypeRepo: Repository<ProductType>,
    @InjectRepository(ProductName)
    private readonly productNameRepo: Repository<ProductName>,
    @InjectRepository(ProductFinish)
    private readonly productFinishRepo: Repository<ProductFinish>,
    @InjectRepository(ProductColor)
    private readonly productColorRepo: Repository<ProductColor>,
    @InjectRepository(ProductSize)
    private readonly productSizeRepo: Repository<ProductSize>,
    @InjectRepository(SupplyType)
    private readonly supplyTypeRepo: Repository<SupplyType>,
    @InjectRepository(ExpenseCategory)
    private readonly expenseCategoryRepo: Repository<ExpenseCategory>,
  ) {
    this.dimensionMap = {
      'product-types': this
        .productTypeRepo as unknown as Repository<CatalogEntity>,
      'product-names': this
        .productNameRepo as unknown as Repository<CatalogEntity>,
      'product-finishes': this
        .productFinishRepo as unknown as Repository<CatalogEntity>,
      'product-colors': this
        .productColorRepo as unknown as Repository<CatalogEntity>,
      'product-sizes': this
        .productSizeRepo as unknown as Repository<CatalogEntity>,
      'supply-types': this
        .supplyTypeRepo as unknown as Repository<CatalogEntity>,
      'expense-categories': this
        .expenseCategoryRepo as unknown as Repository<CatalogEntity>,
    };
  }

  getValidDimensions(): readonly string[] {
    return VALID_DIMENSIONS;
  }

  private getRepository(dimension: string): Repository<CatalogEntity> {
    const repo = this.dimensionMap[dimension as CatalogDimension];

    if (!repo) {
      throw new NotFoundException(`Dimension "${dimension}" no encontrada`);
    }

    return repo;
  }

  async findAll(dimension: string): Promise<CatalogEntity[]> {
    const repo = this.getRepository(dimension);
    return repo.find({ order: { name: 'ASC' } });
  }

  async findOne(dimension: string, id: string): Promise<CatalogEntity> {
    const repo = this.getRepository(dimension);
    const item = await repo.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    return item;
  }

  async create(
    dimension: string,
    dto: CreateCatalogItemDto,
  ): Promise<CatalogEntity> {
    const repo = this.getRepository(dimension);

    try {
      if (this.DIMENSIONS_WITH_SKU.has(dimension) && dto.skuCode == null) {
        const result = await repo
          .createQueryBuilder('item')
          .select('COALESCE(MAX(item.skuCode), 0)', 'maxCode')
          .getRawOne();
        dto.skuCode = (parseInt(result.maxCode, 10) || 0) + 1;
      }

      const item = repo.create(dto);
      return await repo.save(item);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Ya existe un item con ese nombre');
      }
      throw error;
    }
  }

  async update(
    dimension: string,
    id: string,
    dto: UpdateCatalogItemDto,
  ): Promise<CatalogEntity> {
    const item = await this.findOne(dimension, id);
    const repo = this.getRepository(dimension);

    try {
      const merged = repo.merge(item, dto);
      return await repo.save(merged);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Ya existe un item con ese nombre');
      }
      throw error;
    }
  }

  async remove(dimension: string, id: string): Promise<void> {
    const item = await this.findOne(dimension, id);
    const repo = this.getRepository(dimension);

    try {
      await repo.remove(item);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23503'
      ) {
        throw new ConflictException(
          'No se puede eliminar: este item esta siendo usado por otros registros',
        );
      }
      throw error;
    }
  }
}
