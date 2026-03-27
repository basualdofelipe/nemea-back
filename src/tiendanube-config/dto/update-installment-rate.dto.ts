import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateInstallmentRateDto {
  @ApiProperty({
    description: 'Tasa de recargo por cuotas en porcentaje (ej: 8.42)',
    example: 8.42,
  })
  @IsNumber({}, { message: 'La tasa es obligatoria' })
  @Min(0, { message: 'La tasa no puede ser negativa' })
  @Max(100, { message: 'La tasa no puede superar 100%' })
  ratePercent!: number;
}
