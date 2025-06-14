import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { zodValidator } from './config/zod-validator';
import { envSchema } from './config/env.schema';
import { ZodValidationPipe } from 'nestjs-zod';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    validate: zodValidator(envSchema),
  })],
  controllers: [],
  providers: [
    {
    provide: 'APP_PIPE',
    useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
