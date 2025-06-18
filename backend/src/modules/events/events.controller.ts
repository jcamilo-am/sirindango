import { Body, Controller, Get, Post, Param, Patch, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { EventService } from './events.service';
import { CreateEventDto, CreateEventSwaggerDto } from './dto/create-event.dto';
import { UpdateEventDto, UpdateEventSwaggerDto } from './dto/update-event.dto';
import { EventSummarySwaggerDto } from './dto/event-summary.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Eventos')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un evento' })
  @ApiBody({ type: CreateEventSwaggerDto })
  @ApiResponse({ status: 201, description: 'Evento creado', type: CreateEventSwaggerDto })
  create(@Body() body: CreateEventDto) {
    return this.eventService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los eventos' })
  @ApiResponse({ status: 200, description: 'Lista de eventos', type: [CreateEventSwaggerDto] })
  findAll() {
    return this.eventService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un evento por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Evento encontrado', type: CreateEventSwaggerDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un evento' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateEventSwaggerDto })
  @ApiResponse({ status: 200, description: 'Evento actualizado', type: UpdateEventSwaggerDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateEventDto) {
    return this.eventService.update(id, body);
  }

  @Get('search/by-name')
  @ApiOperation({ summary: 'Buscar eventos por nombre' })
  @ApiQuery({ name: 'name', type: String, example: 'Feria' })
  @ApiResponse({ status: 200, description: 'Eventos encontrados', type: [CreateEventSwaggerDto] })
  findByName(@Query('name') name: string) {
    return this.eventService.findByName(name);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Resumen del evento' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Resumen del evento', type: [EventSummarySwaggerDto] })
  async getEventSummary(@Param('id', ParseIntPipe) id: number): Promise<EventSummarySwaggerDto[]> {
    return this.eventService.getEventSummary(id);
  }
}
