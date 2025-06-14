import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { zodValidator } from './config/zod-validator';
import { envSchema } from './config/env.schema';
import { ZodValidationPipe } from 'nestjs-zod';
import { PrismaModule } from './modules/prisma/prisma.module';
import { EventModule } from './modules/event/event.module';
import { ArtisanModule } from './modules/artisan/artisan.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({
    isGlobal: true,
    validate: zodValidator(envSchema),
    }),
    PrismaModule,
    EventModule,
    ArtisanModule,
    ProductModule
  ],
  controllers: [],
  providers: [
    {
    provide: 'APP_PIPE',
    useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
