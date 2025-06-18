import { Module } from '@nestjs/common';
import { SaleService } from './sales.service';
import { SaleController } from './sales.controller';

@Module({
  providers: [SaleService],
  controllers: [SaleController],
})
export class SaleModule {}