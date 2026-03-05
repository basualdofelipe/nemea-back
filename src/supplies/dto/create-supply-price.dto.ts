import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateSupplyPriceDto {
  @ApiProperty({
    description: 'Precio del insumo',
    example: 15200,
  })
  @IsNumber({}, { message: 'El precio es obligatorio' })
  @IsNotEmpty({ message: 'El precio es obligatorio' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price!: number;
}
