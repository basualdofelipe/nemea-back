import { ApiProperty } from '@nestjs/swagger';

class AuthUserDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id!: number;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email del usuario',
  })
  email!: string;

  @ApiProperty({ example: 'admin', description: 'Rol del usuario' })
  role!: string;

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
