import { Module } from '@nestjs/common';
import { EventService } from './events.service';
import { EventController } from './events.controller';

@Module({
  providers: [EventService],
  controllers: [EventController]
})
export class EventModule {}
