import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({
    description: 'Nombre del proveedor',
    example: 'Curtiembre Central',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(255)
  name!: string;

  @ApiProperty({ required: false, description: 'Direccion del proveedor' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiProperty({ required: false, description: 'Email del proveedor' })
  @IsEmail({}, { message: 'Email invalido' })
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, description: 'Telefono del proveedor' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({ required: false, description: 'WhatsApp del proveedor' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  whatsapp?: string;

  @ApiProperty({
    required: false,
    description: 'Descripcion o notas sobre el proveedor',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
