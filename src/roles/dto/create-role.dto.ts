import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'EDITOR',
    description: 'Nombre del rol',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'Puede editar productos e insumos',
    description: 'Descripción del rol',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value ?? false)
  canViewProducts?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value ?? false)
  canEditProducts?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value ?? false)
  canViewSupplies?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value ?? false)
  canEditSupplies?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value ?? false)
  canViewExpenses?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value ?? false)
  canEditExpenses?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value ?? false)
  canUseCalculator?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value ?? false)
  canManageScenarios?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value ?? false)
  canViewDashboard?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value ?? false)
  canManageConfig?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value ?? false)
  canManageUsers?: boolean;
}
