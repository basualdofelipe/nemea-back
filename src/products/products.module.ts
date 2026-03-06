import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { SuppliesPerProductHistory } from './entities/supplies-per-product-history.entity';
import { ProductPriceHistory } from './entities/product-price-history.entity';
import { ProductType } from '../catalogs/entities/product-type.entity';
import { ProductName } from '../catalogs/entities/product-name.entity';
import { ProductFinish } from '../catalogs/entities/product-finish.entity';
import { ProductColor } from '../catalogs/entities/product-color.entity';
import { ProductSize } from '../catalogs/entities/product-size.entity';
import { Supply } from '../supplies/entities/supply.entity';
import { CostsModule } from '../costs/costs.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    CostsModule,
    TypeOrmModule.forFeature([
      Product,
      SuppliesPerProductHistory,
      ProductPriceHistory,
      ProductType,
      ProductName,
      ProductFinish,
      ProductColor,
      ProductSize,
      Supply,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
