import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateBatchProductsDto {
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

  @ApiProperty({
    description: 'IDs de colores para la creacion batch',
    type: [String],
  })
  @IsArray({ message: 'Debe enviar un array de colores' })
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos un color' })
  @IsUUID('all', { each: true, message: 'Cada color debe ser un UUID valido' })
  colorIds!: string[];

  @ApiProperty({
    description: 'IDs de talles para la creacion batch',
    type: [String],
  })
  @IsArray({ message: 'Debe enviar un array de talles' })
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos un talle' })
  @IsUUID('all', { each: true, message: 'Cada talle debe ser un UUID valido' })
  sizeIds!: string[];
}
