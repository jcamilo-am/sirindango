import { Module } from '@nestjs/common';
import { InventoryMovementService } from './inventory-movement.service';
import { InventoryMovementController } from './inventory-movement.controller';

@Module({
  providers: [InventoryMovementService],
  controllers: [InventoryMovementController],
})
export class InventoryMovementModule {}