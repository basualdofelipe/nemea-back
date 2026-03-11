import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateProductDto {
  @ApiProperty({ description: 'ID del tipo de producto' })
  @IsUUID('all', { message: 'El tipo de producto es obligatorio' })
  @IsNotEmpty({ message: 'El tipo de producto es obligatorio' })
  typeId!: string;

  @ApiProperty({ description: 'ID del nombre de producto' })
  @IsUUID('all', { message: 'El nombre de producto es obligatorio' })
  @IsNotEmpty({ message: 'El nombre de producto es obligatorio' })
  nameId!: string;

  @ApiProperty({ description: 'ID de la terminacion' })
  @IsUUID('all', { message: 'La terminacion es obligatoria' })
  @IsNotEmpty({ message: 'La terminacion es obligatoria' })
  finishId!: string;

  @ApiProperty({ description: 'ID del color' })
  @IsUUID('all', { message: 'El color es obligatorio' })
  @IsNotEmpty({ message: 'El color es obligatorio' })
  colorId!: string;

  @ApiProperty({ description: 'ID del talle' })
  @IsUUID('all', { message: 'El talle es obligatorio' })
  @IsNotEmpty({ message: 'El talle es obligatorio' })
  sizeId!: string;
}
