import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdatePlanDto {
  @ApiPropertyOptional({
    description: 'CPT para Pago Nube en porcentaje',
    example: 0.0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El CPT de Pago Nube debe ser un numero' })
  @Min(0, { message: 'El CPT no puede ser negativo' })
  @Max(100, { message: 'El CPT no puede superar 100%' })
  cptPagoNube?: number;

  @ApiPropertyOptional({
    description: 'CPT para otras pasarelas en porcentaje',
    example: 2.0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El CPT de otras pasarelas debe ser un numero' })
  @Min(0, { message: 'El CPT no puede ser negativo' })
  @Max(100, { message: 'El CPT no puede superar 100%' })
  cptOtherGateways?: number;
}
