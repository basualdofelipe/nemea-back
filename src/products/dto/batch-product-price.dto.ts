import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNumber, IsUUID, Min } from 'class-validator';

export class BatchProductPriceDto {
  @ApiProperty({
    description: 'UUIDs de los productos',
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  productIds!: string[];

  @ApiProperty({
    description: 'Precio de venta a asignar',
    example: 25000,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  price!: number;
}
