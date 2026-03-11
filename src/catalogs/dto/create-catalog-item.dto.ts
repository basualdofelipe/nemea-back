import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCatalogItemDto {
  @ApiProperty({ description: 'Nombre del item', example: 'Billetera' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    required: false,
    description: 'Codigo SKU numerico del item',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'El codigo SKU debe ser un numero entero' })
  @Min(0, { message: 'El codigo SKU no puede ser negativo' })
  skuCode?: number;
}
