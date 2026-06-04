import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class DemoLoginDto {
  @ApiProperty({
    example: 'demo@hefesto.com',
    description:
      'Debe coincidir exactamente con el email demo configurado (DEMO_EMAIL). No es un selector de cuenta: el endpoint siempre inicia sesión en la cuenta demo fijada, no en la cuenta que indique este email.',
  })
  @IsEmail()
  email!: string;
}
