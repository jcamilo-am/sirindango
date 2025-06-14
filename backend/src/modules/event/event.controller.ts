import { Body, Controller, Get, Post, Param, Patch, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventSummaryDto } from './dto/event-summary.dto';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  create(@Body() body: CreateEventDto) {
    return this.eventService.create(body);
  }

  @Get()
  findAll() {
    return this.eventService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateEventDto) {
    return this.eventService.update(id, body);
  }

  @Get('search/by-name')
  findByName(@Query('name') name: string) {
    return this.eventService.findByName(name);
  }

  @Get(':id/summary')
  async getEventSummary(@Param('id', ParseIntPipe) id: number): Promise<EventSummaryDto[]> {
    return this.eventService.getEventSummary(id);
  }
}
