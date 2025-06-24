import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { setupSwagger } from './config/swagger.config';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS detallado
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean), // Filtra valores undefined/null
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  setupSwagger(app);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT');

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  await app.listen(port, '0.0.0.0');
  Logger.log(`Server is running on port ${port}`, 'Bootstrap');
}
bootstrap();