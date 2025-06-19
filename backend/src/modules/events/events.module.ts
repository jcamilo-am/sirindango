import { Module } from '@nestjs/common';
import { EventController } from './events.controller';
import { EventService } from './events.service';
import { PdfMakeModule } from '../../common/pdf/pdfmake.module';

@Module({
  imports: [PdfMakeModule],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
