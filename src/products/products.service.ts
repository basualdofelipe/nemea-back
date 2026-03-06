import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, QueryFailedError, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductType } from '../catalogs/entities/product-type.entity';
import { ProductName } from '../catalogs/entities/product-name.entity';
import { ProductFinish } from '../catalogs/entities/product-finish.entity';
import { ProductColor } from '../catalogs/entities/product-color.entity';
import { ProductSize } from '../catalogs/entities/product-size.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateBatchProductsDto } from './dto/create-batch-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
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
    private readonly entityManager: EntityManager,
  ) {}

  private generateSkuCode(
    type: ProductType,
    name: ProductName,
    finish: ProductFinish,
    color: ProductColor,
    size: ProductSize,
  ): string {
    return `${type.skuCode}.${name.skuCode}.${finish.skuCode}.${color.skuCode}.${size.skuCode}`;
  }

  async findAll(includeInactive: boolean = false): Promise<Product[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.productRepo.find({
      where,
      order: { type: { name: 'ASC' }, name: { name: 'ASC' } },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const { type, name, finish, color, size } = await this.loadDimensions(dto);

    const skuCode = this.generateSkuCode(type, name, finish, color, size);

    try {
      const product = this.productRepo.create({
        skuCode,
        type,
        name,
        finish,
        color,
        size,
      });
      return await this.productRepo.save(product);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'Ya existe un producto activo con esa combinacion',
        );
      }
      throw error;
    }
  }

  async createBatch(dto: CreateBatchProductsDto): Promise<Product[]> {
    const type = await this.productTypeRepo.findOne({
      where: { id: dto.typeId },
    });
    if (!type) {
      throw new NotFoundException('Tipo de producto no encontrado');
    }

    const name = await this.productNameRepo.findOne({
      where: { id: dto.nameId },
    });
    if (!name) {
      throw new NotFoundException('Nombre de producto no encontrado');
    }

    const finish = await this.productFinishRepo.findOne({
      where: { id: dto.finishId },
    });
    if (!finish) {
      throw new NotFoundException('Terminacion no encontrada');
    }

    const colors = await this.productColorRepo.find({
      where: { id: In(dto.colorIds) },
    });
    if (colors.length !== dto.colorIds.length) {
      throw new NotFoundException('Uno o mas colores no fueron encontrados');
    }

    const sizes = await this.productSizeRepo.find({
      where: { id: In(dto.sizeIds) },
    });
    if (sizes.length !== dto.sizeIds.length) {
      throw new NotFoundException('Uno o mas talles no fueron encontrados');
    }

    try {
      return await this.entityManager.transaction(async (manager) => {
        const products: Product[] = [];

        for (const color of colors) {
          for (const size of sizes) {
            const skuCode = this.generateSkuCode(
              type,
              name,
              finish,
              color,
              size,
            );
            const product = manager.create(Product, {
              skuCode,
              type,
              name,
              finish,
              color,
              size,
            });
            products.push(product);
          }
        }

        return manager.save(Product, products);
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'Una o mas combinaciones de producto ya existen como activas',
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    const { type, name, finish, color, size } = await this.loadDimensions(dto);

    product.type = type;
    product.name = name;
    product.finish = finish;
    product.color = color;
    product.size = size;
    product.skuCode = this.generateSkuCode(type, name, finish, color, size);

    try {
      return await this.productRepo.save(product);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'Ya existe un producto activo con esa combinacion',
        );
      }
      throw error;
    }
  }

  async toggleStatus(id: string): Promise<Product> {
    const product = await this.findOne(id);
    product.isActive = !product.isActive;
    return this.productRepo.save(product);
  }

  private async loadDimensions(dto: {
    typeId: string;
    nameId: string;
    finishId: string;
    colorId: string;
    sizeId: string;
  }): Promise<{
    type: ProductType;
    name: ProductName;
    finish: ProductFinish;
    color: ProductColor;
    size: ProductSize;
  }> {
    const type = await this.productTypeRepo.findOne({
      where: { id: dto.typeId },
    });
    if (!type) {
      throw new NotFoundException('Tipo de producto no encontrado');
    }

    const name = await this.productNameRepo.findOne({
      where: { id: dto.nameId },
    });
    if (!name) {
      throw new NotFoundException('Nombre de producto no encontrado');
    }

    const finish = await this.productFinishRepo.findOne({
      where: { id: dto.finishId },
    });
    if (!finish) {
      throw new NotFoundException('Terminacion no encontrada');
    }

    const color = await this.productColorRepo.findOne({
      where: { id: dto.colorId },
    });
    if (!color) {
      throw new NotFoundException('Color no encontrado');
    }

    const size = await this.productSizeRepo.findOne({
      where: { id: dto.sizeId },
    });
    if (!size) {
      throw new NotFoundException('Talle no encontrado');
    }

    return { type, name, finish, color, size };
  }
}
