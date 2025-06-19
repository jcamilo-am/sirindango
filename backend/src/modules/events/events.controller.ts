import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, UseGuards, Res } from '@nestjs/common';
import { EventService } from './events.service';
import { CreateEventDto, CreateEventSwaggerDto } from './dto/create-event.dto';
import { UpdateEventDto, UpdateEventSwaggerDto } from './dto/update-event.dto';
import { EventSummaryDto } from './dto/event-summary.dto';
import { EventAccountingSummaryDto } from './dto/event-accounting-summary.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PdfMakeService } from '../../common/pdf/pdfmake.service';
import { Response } from 'express';
import { buildEventAccountingPdf } from 'src/common/pdf/build-event-accounting-pdf';

@ApiTags('Eventos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly pdfMakeService: PdfMakeService,
  ) {}

  /**
   * Crea un evento.
   * La lógica de validación y guardado está en el servicio.
   */
  @Post()
  @ApiOperation({ summary: 'Crear un evento' })
  @ApiBody({ type: CreateEventSwaggerDto })
  @ApiResponse({ status: 201, description: 'Evento creado', type: CreateEventSwaggerDto })
  create(@Body() body: CreateEventDto) {
    return this.eventService.create(body);
  }

  /**
   * Lista todos los eventos.
   */
  @Get()
  @ApiOperation({ summary: 'Listar todos los eventos' })
  @ApiResponse({ status: 200, description: 'Lista de eventos', type: [CreateEventSwaggerDto] })
  findAll() {
    return this.eventService.findAll();
  }

  /**
   * Obtiene un evento por ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un evento por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Evento encontrado', type: CreateEventSwaggerDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.findOne(id);
  }

  /**
   * Actualiza un evento por ID.
   * La lógica de validación está en el servicio.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un evento' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateEventSwaggerDto })
  @ApiResponse({ status: 200, description: 'Evento actualizado', type: UpdateEventSwaggerDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateEventDto) {
    return this.eventService.update(id, body);
  }

  /**
   * Busca eventos por nombre (búsqueda parcial).
   */
  @Get('search/by-name')
  @ApiOperation({ summary: 'Buscar eventos por nombre' })
  @ApiQuery({ name: 'name', type: String, example: 'Feria' })
  @ApiResponse({ status: 200, description: 'Eventos encontrados', type: [CreateEventSwaggerDto] })
  findByName(@Query('name') name: string) {
    return this.eventService.findByName(name);
  }

  /**
   * Obtiene el resumen de un evento por ID.
   * Incluye totales por método de pago, comisión de la asociación y neto para artesanos.
   * La lógica de cálculo está en el servicio.
   */
  @Get(':id/summary')
  @ApiOperation({ summary: 'Resumen del evento' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Resumen del evento', type: EventSummaryDto })
  async getEventSummary(@Param('id', ParseIntPipe) id: number): Promise<EventSummaryDto> {
    return this.eventService.getEventSummary(id);
  }

  /**
   * Cierra un evento (cambia el estado a CLOSED y bloquea ventas/productos).
   * La lógica de validación y cierre está en el servicio.
   */
  @Patch(':id/close')
  @ApiOperation({ summary: 'Cerrar evento (bloquea ventas y productos)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Evento cerrado', type: CreateEventSwaggerDto })
  closeEvent(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.closeEvent(id);
  }

  /**
   * Obtiene el resumen contable general de un evento por ID.
   * Incluye detalle por artesano y totales.
   * La lógica de cálculo está en el servicio.
   */
  @Get(':id/accounting-summary')
  @ApiOperation({ summary: 'Resumen contable general del evento (detalle por artesano y totales)' })
  @ApiResponse({ status: 200, type: EventAccountingSummaryDto })
  async getEventAccountingSummary(@Param('id', ParseIntPipe) id: number): Promise<EventAccountingSummaryDto> {
    return this.eventService.getEventAccountingSummary(id);
  }

  /**
   * Descarga el resumen contable de un evento en formato PDF.
   */
  @Get(':id/accounting-summary/pdf')
  @ApiOperation({ summary: 'Descargar resumen contable del evento en PDF' })
  async downloadEventAccountingSummaryPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const summary = await this.eventService.getEventAccountingSummary(id);

    // Arma el docDefinition para PDFMake
    const docDefinition = buildEventAccountingPdf(summary);

    const pdfBuffer = await this.pdfMakeService.generatePdf(docDefinition);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="evento_${id}_resumen.pdf"`,
    });
    res.end(pdfBuffer);
  }
}
