import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';

interface HealthResponse {
  status: string;
  app: string;
  version: string;
  uptime: number;
}

@ApiTags('health')
@Controller()
export class AppController {
  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
  })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      app: 'nemea-back',
      version: '0.1.0',
      uptime: process.uptime(),
    };
  }
}
