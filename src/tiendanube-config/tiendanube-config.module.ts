import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TnPaymentGateway } from './entities/tn-payment-gateway.entity';
import { TnGatewayRate } from './entities/tn-gateway-rate.entity';
import { TnInstallmentRate } from './entities/tn-installment-rate.entity';
import { TnTaxConfig } from './entities/tn-tax-config.entity';
import { TnPlan } from './entities/tn-plan.entity';
import { TiendanubeConfigController } from './tiendanube-config.controller';
import { TiendanubeConfigService } from './tiendanube-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TnPaymentGateway,
      TnGatewayRate,
      TnInstallmentRate,
      TnTaxConfig,
      TnPlan,
    ]),
  ],
  controllers: [TiendanubeConfigController],
  providers: [TiendanubeConfigService],
  exports: [TiendanubeConfigService],
})
export class TiendanubeConfigModule {}
