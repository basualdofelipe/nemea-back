import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { BomItemDto } from './update-bom.dto';

export class BatchBomDto {
  @ApiProperty({
    description: 'UUIDs de los productos a actualizar',
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  productIds!: string[];

  @ApiProperty({
    description: 'Lista de insumos con cantidad',
    type: [BomItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomItemDto)
  items!: BomItemDto[];
}
