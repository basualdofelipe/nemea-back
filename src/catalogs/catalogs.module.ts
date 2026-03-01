import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogsController } from './catalogs.controller';
import { CatalogsService } from './catalogs.service';
import { ProductColor } from './entities/product-color.entity';
import { ProductFinish } from './entities/product-finish.entity';
import { ProductName } from './entities/product-name.entity';
import { ProductSize } from './entities/product-size.entity';
import { ProductType } from './entities/product-type.entity';
import { SupplyType } from './entities/supply-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductType,
      ProductName,
      ProductFinish,
      ProductColor,
      ProductSize,
      SupplyType,
    ]),
  ],
  controllers: [CatalogsController],
  providers: [CatalogsService],
  exports: [CatalogsService],
})
export class CatalogsModule {}
