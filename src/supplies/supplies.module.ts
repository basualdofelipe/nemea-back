import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supply } from './entities/supply.entity';
import { SupplyPriceHistory } from './entities/supply-price-history.entity';
import { SupplyType } from '../catalogs/entities/supply-type.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { SuppliesPerProductHistory } from '../products/entities/supplies-per-product-history.entity';
import { SuppliesController } from './supplies.controller';
import { SuppliesService } from './supplies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supply,
      SupplyPriceHistory,
      SupplyType,
      Supplier,
      SuppliesPerProductHistory,
    ]),
  ],
  controllers: [SuppliesController],
  providers: [SuppliesService],
  exports: [SuppliesService],
})
export class SuppliesModule {}
