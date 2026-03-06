import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductType } from '../catalogs/entities/product-type.entity';
import { ProductName } from '../catalogs/entities/product-name.entity';
import { ProductFinish } from '../catalogs/entities/product-finish.entity';
import { ProductColor } from '../catalogs/entities/product-color.entity';
import { ProductSize } from '../catalogs/entities/product-size.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductType,
      ProductName,
      ProductFinish,
      ProductColor,
      ProductSize,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
