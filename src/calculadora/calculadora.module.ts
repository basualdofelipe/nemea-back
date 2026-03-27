import { Module } from '@nestjs/common';
import { TiendanubeConfigModule } from '../tiendanube-config/tiendanube-config.module';
import { CostsModule } from '../costs/costs.module';
import { ProductsModule } from '../products/products.module';
import { CalculadoraController } from './calculadora.controller';
import { CalculadoraService } from './calculadora.service';

@Module({
  imports: [TiendanubeConfigModule, CostsModule, ProductsModule],
  controllers: [CalculadoraController],
  providers: [CalculadoraService],
  exports: [CalculadoraService],
})
export class CalculadoraModule {}
