import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Monto del gasto',
    example: 15200.5,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto debe ser un numero con hasta 2 decimales' },
  )
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount!: number;

  @ApiProperty({
    description: 'Concepto del gasto',
    example: 'Compra de cuero vacheta',
  })
  @IsString()
  @IsNotEmpty({ message: 'El concepto es obligatorio' })
  concept!: string;

  @ApiProperty({
    description: 'Fecha del gasto (formato ISO date)',
    example: '2026-03-01',
  })
  @IsDateString({}, { message: 'La fecha debe tener formato ISO valido' })
  date!: string;

  @ApiProperty({
    description: 'ID de la categoria de gasto',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('all', { message: 'La categoria debe ser un UUID valido' })
  categoryId!: string;
}
