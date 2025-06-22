import { Module } from '@nestjs/common';
import { PdfMakeService } from './pdfmake.service';

@Module({
  providers: [PdfMakeService],
  exports: [PdfMakeService],
})
export class PdfMakeModule {}
