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
  @ApiProperty({ example: 'Editor', description: 'Nombre del rol' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'Puede editar productos e insumos',
    description: 'Descripcion del rol',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }): boolean => value ?? false)
  canViewProducts?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }): boolean => value ?? false)
  canEditProducts?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }): boolean => value ?? false)
  canViewSupplies?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }): boolean => value ?? false)
  canEditSupplies?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }): boolean => value ?? false)
  canViewExpenses?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }): boolean => value ?? false)
  canEditExpenses?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }): boolean => value ?? false)
  canUseCalculator?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }): boolean => value ?? false)
  canManageScenarios?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }): boolean => value ?? false)
  canViewDashboard?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }): boolean => value ?? false)
  canManageConfig?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }): boolean => value ?? false)
  canManageUsers?: boolean;
}
