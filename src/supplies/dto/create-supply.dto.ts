import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { UnitType } from '../entities/supply.entity';

export class CreateSupplyDto {
  @ApiProperty({ description: 'Nombre del insumo', example: 'Cuero Vacheta' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'ID del tipo de insumo' })
  @IsUUID('all', { message: 'El tipo es obligatorio' })
  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  typeId!: string;

  @ApiProperty({ description: 'ID del proveedor' })
  @IsUUID('all', { message: 'El proveedor es obligatorio' })
  @IsNotEmpty({ message: 'El proveedor es obligatorio' })
  supplierId!: string;

  @ApiProperty({
    description: 'Unidad de medida',
    enum: UnitType,
    example: UnitType.UNIDAD,
  })
  @IsEnum(UnitType, { message: 'Unidad de medida invalida' })
  unitType!: UnitType;

  @ApiProperty({ required: false, description: 'Notas del insumo' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    required: false,
    description: 'Precio inicial (opcional)',
    example: 15200,
  })
  @IsNumber({}, { message: 'El precio debe ser un numero' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @IsOptional()
  initialPrice?: number;
}
