import { Module } from '@nestjs/common';
import { ProductChangeService } from './product-change.service';
import { ProductChangeController } from './product-change.controller';

@Module({
  providers: [ProductChangeService],
  controllers: [ProductChangeController],
  exports: [ProductChangeService],
})
export class ProductChangeModule {}
