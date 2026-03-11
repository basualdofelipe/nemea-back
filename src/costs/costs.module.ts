import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliesPerProductHistory } from '../products/entities/supplies-per-product-history.entity';
import { SupplyPriceHistory } from '../supplies/entities/supply-price-history.entity';
import { CostsService } from './costs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SuppliesPerProductHistory, SupplyPriceHistory]),
  ],
  providers: [CostsService],
  exports: [CostsService],
})
export class CostsModule {}
