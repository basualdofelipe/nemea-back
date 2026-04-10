import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email del usuario',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ required: false, description: 'UUID del rol a asignar' })
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiProperty({ required: false, description: 'Nombre del usuario' })
  @IsString()
  @IsOptional()
  name?: string;
}
