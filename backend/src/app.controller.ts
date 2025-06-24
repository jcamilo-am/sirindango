import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  getRoot() {
    return {
      message: 'Sirindango API está funcionando correctamente',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      status: 'healthy'
    };
  }

  @Get('health')
  @Public()
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
} 