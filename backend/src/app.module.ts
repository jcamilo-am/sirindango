import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { zodValidator } from './config/zod-validator';
import { envSchema } from './config/env.schema';
import { ZodValidationPipe } from 'nestjs-zod';
import { PrismaModule } from './modules/prisma/prisma.module';
import { EventModule } from './modules/events/events.module';
import { ArtisanModule } from './modules/artisans/artisans.module';
import { ProductModule } from './modules/products/products.module';
import { SaleModule } from './modules/sales/sales.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductChangeModule } from './modules/poduct-changes/product-change.module';
import { PdfMakeService } from './common/pdf/pdfmake.service';

@Module({
  imports: [
    ConfigModule.forRoot({
    isGlobal: true,
    validate: zodValidator(envSchema),
    }),
    PrismaModule,
    EventModule,
    ArtisanModule,
    ProductModule,
    SaleModule,
    UsersModule,
    AuthModule,
    ProductChangeModule
  ],
  controllers: [],
  providers: [
    {
    provide: 'APP_PIPE',
    useClass: ZodValidationPipe,
    },
    PdfMakeService
  ],
})
export class AppModule {}
