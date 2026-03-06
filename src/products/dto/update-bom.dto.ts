import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class BomItemDto {
  @ApiProperty({
    description: 'UUID del insumo',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  supplyId!: string;

  @ApiProperty({
    description: 'Cantidad del insumo',
    example: 0.25,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  quantity!: number;
}

export class UpdateBomDto {
  @ApiProperty({
    description:
      'Lista de insumos con cantidad (puede estar vacia para limpiar el BOM)',
    type: [BomItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomItemDto)
  items!: BomItemDto[];
}
