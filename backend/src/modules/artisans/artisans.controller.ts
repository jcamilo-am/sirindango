import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { ArtisanService } from './artisans.service';
import { CreateArtisanDto, CreateArtisanSwaggerDto } from './dto/create-artisan.dto';
import { UpdateArtisanDto, UpdateArtisanSwaggerDto } from './dto/update-artisan.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('Artesanos')
@Controller('artisans')
export class ArtisanController {
  constructor(private readonly artisanService: ArtisanService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo artesano' })
  @ApiBody({
    type: CreateArtisanSwaggerDto,
    examples: {
      ejemplo: {
        summary: 'Ejemplo de artesano',
        value: {
          name: 'Juana Pérez',
          identification: '1234567890',
          active: true,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Artesano creado', type: CreateArtisanSwaggerDto })
  create(@Body() data: CreateArtisanDto) {
    return this.artisanService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los artesanos' })
  @ApiResponse({ status: 200, description: 'Lista de artesanos', type: [CreateArtisanSwaggerDto] })
  findAll() {
    return this.artisanService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un artesano por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Artesano encontrado', type: CreateArtisanSwaggerDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.artisanService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un artesano' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    type: UpdateArtisanSwaggerDto,
    examples: {
      ejemplo: {
        summary: 'Actualizar nombre',
        value: {
          name: 'Juana Actualizada',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Artesano actualizado', type: UpdateArtisanSwaggerDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateArtisanDto,
  ) {
    return this.artisanService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un artesano' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Artesano eliminado', type: CreateArtisanSwaggerDto })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.artisanService.remove(id);
  }

  @Get(':id/by-event/:eventId')
  @ApiOperation({ summary: 'Obtener productos y ventas de un artesano en un evento' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiParam({ name: 'eventId', type: Number, example: 2 })
  @ApiResponse({ status: 200, description: 'Datos del artesano para el evento', type: CreateArtisanSwaggerDto })
  async findByIdByEvent(
    @Param('id', ParseIntPipe) id: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    return this.artisanService.findByIdByEvent(id, eventId);
  }
}