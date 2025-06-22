import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  ParseIntPipe,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { EventService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import {
  EventEntity,
  EventWithSummaryEntity,
  EventWithAccountingEntity,
} from './entities/event.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ status: 201, description: 'Evento creado', type: EventEntity })
  create(@Body() body: CreateEventDto): Promise<EventEntity> {
    return this.eventService.create(body);
  }

  /**
   * Lista todos los eventos.
   */
  @Get()
  @ApiOperation({ summary: 'Listar todos los eventos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de eventos',
    type: [EventEntity],
  })
  findAll(): Promise<EventEntity[]> {
    return this.eventService.findAll();
  }

  /**
   * Obtiene un evento por ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un evento por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Evento encontrado',
    type: EventEntity,
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<EventEntity> {
    return this.eventService.findOne(id);
  }

  /**
   * Actualiza un evento por ID.
   * La lógica de validación está en el servicio.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un evento' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({
    status: 200,
    description: 'Evento actualizado',
    type: EventEntity,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateEventDto,
  ): Promise<EventEntity> {
    return this.eventService.update(id, body);
  }

  /**
   * Busca eventos por nombre (búsqueda parcial).
   */
  @Get('search/by-name')
  @ApiOperation({ summary: 'Buscar eventos por nombre' })
  @ApiQuery({ name: 'name', type: String, example: 'Feria' })
  @ApiResponse({
    status: 200,
    description: 'Eventos encontrados',
    type: [EventEntity],
  })
  findByName(@Query('name') name: string): Promise<EventEntity[]> {
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
  @ApiResponse({
    status: 200,
    description: 'Resumen del evento',
    type: EventWithSummaryEntity,
  })
  async getEventSummary(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventWithSummaryEntity> {
    return this.eventService.getEventSummary(id);
  }

  /**
   * Cierra un evento (cambia el estado a CLOSED y bloquea ventas/productos).
   * La lógica de validación y cierre está en el servicio.
   */
  @Patch(':id/close')
  @ApiOperation({ summary: 'Cerrar evento (bloquea ventas y productos)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Evento cerrado',
    type: EventEntity,
  })
  closeEvent(@Param('id', ParseIntPipe) id: number): Promise<EventEntity> {
    return this.eventService.closeEvent(id);
  }

  /**
   * Obtiene el resumen contable general de un evento por ID.
   * Incluye detalle por artesano y totales.
   * La lógica de cálculo está en el servicio.
   */
  @Get(':id/accounting-summary')
  @ApiOperation({
    summary:
      'Resumen contable general del evento (detalle por artesano y totales)',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Resumen contable del evento',
    type: EventWithAccountingEntity,
  })
  async getEventAccountingSummary(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventWithAccountingEntity> {
    return this.eventService.getEventAccountingSummary(id);
  }

  /**
   * Descarga el resumen contable de un evento en formato PDF.
   */
  @Get(':id/accounting-summary/pdf')
  @ApiOperation({ summary: 'Descargar resumen contable del evento en PDF' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  async downloadEventAccountingSummaryPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const summary = await this.eventService.getEventAccountingSummary(id);

    // Convierte la entidad al DTO necesario para el PDF
    const docDefinition = buildEventAccountingPdf(summary.toPdfDto());

    const pdfBuffer = await this.pdfMakeService.generatePdf(docDefinition);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="evento_${id}_resumen.pdf"`,
    });
    res.end(pdfBuffer);
  }
}
