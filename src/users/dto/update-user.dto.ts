import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false, description: 'Nombre del usuario' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, description: 'UUID del rol a asignar' })
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiProperty({
    required: false,
    description: 'Estado activo/inactivo del usuario',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
