import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class QueryExpensesDto {
  @ApiPropertyOptional({
    description: 'Filtrar por categoria de gasto',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID('all', { message: 'La categoria debe ser un UUID valido' })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Fecha desde (inclusive)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'dateFrom debe tener formato ISO valido' })
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta (inclusive)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'dateTo debe tener formato ISO valido' })
  dateTo?: string;
}
