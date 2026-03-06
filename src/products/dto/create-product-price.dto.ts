import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CreateProductPriceDto {
  @ApiProperty({
    description: 'Precio de venta del producto',
    example: 25000,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  price!: number;
}
