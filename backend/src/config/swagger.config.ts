// src/config/swagger.config.ts
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('API del Comercio Artesanal')
    .setDescription('Documentación oficial del backend')
    .setVersion('1.0')
    .addTag('Eventos')
    .addTag('Productos')
    .addTag('Ventas')
    .addTag('Artesanos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // http://localhost:3000/docs
}
