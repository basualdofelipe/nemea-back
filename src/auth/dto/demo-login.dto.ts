import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class DemoLoginDto {
  @ApiProperty({
    example: 'demo@hefesto.com',
    description: 'Email del usuario demo',
  })
  @IsEmail()
  email!: string;
}
