import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    required: false,
    nullable: true,
    maxLength: 255,
    description: 'Nombre del usuario (null para limpiar)',
  })
  // ValidateIf skips IsString + MaxLength when the value is explicitly null,
  // allowing the frontend to clear the name. Omitted (undefined) is also
  // allowed by IsOptional. WR-06: accept null; WR-08: enforce DB length.
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(255, { message: 'El nombre no puede superar los 255 caracteres' })
  @IsOptional()
  name?: string | null;

  @ApiProperty({ required: false, description: 'UUID del rol a asignar' })
  // WR-A2: @IsOptional() skips validation for null AND undefined, which lets
  // { roleId: null } slip through to the service where it produced a
  // misleading "No puedes cambiar tu propio rol" error. ValidateIf rejects
  // explicit null at the validation layer, mirroring the same pattern used
  // for `name` above. The service also has a defensive guard for null.
  @ValidateIf((_, value) => value !== null)
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
