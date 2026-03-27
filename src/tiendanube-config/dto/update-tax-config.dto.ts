import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateTaxConfigDto {
  @ApiProperty({
    description: 'Alicuota de IVA en porcentaje (ej: 21.00)',
    example: 21.0,
  })
  @IsNumber({}, { message: 'La tasa de IVA es obligatoria' })
  @Min(0, { message: 'La tasa de IVA no puede ser negativa' })
  @Max(100, { message: 'La tasa de IVA no puede superar 100%' })
  ivaRate!: number;

  @ApiProperty({
    description: 'Alicuota de IIBB/SIRTAC en porcentaje (ej: 3.50)',
    example: 3.5,
  })
  @IsNumber({}, { message: 'La tasa de IIBB es obligatoria' })
  @Min(0, { message: 'La tasa de IIBB no puede ser negativa' })
  @Max(100, { message: 'La tasa de IIBB no puede superar 100%' })
  iibbRate!: number;
}
