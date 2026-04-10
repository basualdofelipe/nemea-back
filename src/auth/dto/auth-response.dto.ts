import { ApiProperty } from '@nestjs/swagger';
import type { Permissions } from '../../common/types/permission';

class AuthUserDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'User ID',
  })
  id!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email del usuario',
  })
  email!: string;

  @ApiProperty({
    description: 'Permisos del usuario',
  })
  permissions!: Permissions;

  @ApiProperty({
    example: 'Juan Perez',
    description: 'Nombre del usuario',
    nullable: true,
  })
  name!: string | null;

  @ApiProperty({
    example: 'https://lh3.googleusercontent.com/a/photo.jpg',
    description: 'URL de la foto de perfil',
    nullable: true,
  })
  pictureUrl!: string | null;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken!: string;

  @ApiProperty({
    type: AuthUserDto,
    description: 'Datos del usuario autenticado',
  })
  user!: AuthUserDto;
}
