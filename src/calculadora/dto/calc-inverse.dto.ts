import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalcInverseDto {
  @ApiPropertyOptional({
    description: 'Product UUID -- if provided, cost fetched from DB',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Desired profit per unit', example: 50000 })
  @IsNumber()
  @IsPositive()
  gananciaDeseada!: number;

  @ApiProperty({ description: 'Shipping cost (with IVA)', example: 7315 })
  @IsNumber()
  @Min(0)
  costoEnvio!: number;

  @ApiPropertyOptional({
    description: 'Product cost (without IVA) -- used if no productId',
    example: 6534.48,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costoProducto?: number;

  @ApiProperty({ description: 'Gateway slug', example: 'pago_nube' })
  @IsString()
  gatewaySlug!: string;

  @ApiProperty({
    description: 'Payment method',
    example: 'tarjeta_debito_credito',
  })
  @IsString()
  paymentMethod!: string;

  @ApiProperty({ description: 'Withdrawal days', example: 14 })
  @IsNumber()
  @Min(0)
  withdrawalDays!: number;

  @ApiProperty({
    description: 'Number of installments',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  installments: number = 1;

  @ApiPropertyOptional({
    description: 'Plan slug override',
    example: 'esencial',
  })
  @IsOptional()
  @IsString()
  planSlug?: string;
}
