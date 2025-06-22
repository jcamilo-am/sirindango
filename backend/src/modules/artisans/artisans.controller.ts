import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ArtisanService } from './artisans.service';
import { CreateArtisanDto } from './dto/create-artisan.dto';
import { UpdateArtisanDto } from './dto/update-artisan.dto';
import {
  ArtisanEntity,
  ArtisanWithProductsEntity,
} from './entities/artisan.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ArtisanSummarySwaggerDto,
  ArtisanSummaryContableDto,
} from './dto/artisan-product-summary.dto';

@ApiTags('Artesanos')
@ApiBearerAuth() // Swagger: requiere JWT
@UseGuards(JwtAuthGuard) // Protege todas las rutas con JWT
@Controller('artisans')
export class ArtisanController {
  constructor(private readonly artisanService: ArtisanService) {}

  /**
   * Crea un nuevo artesano.
   * POST /artisans
   */
  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo artesano' })
  @ApiBody({ type: CreateArtisanDto })
  @ApiResponse({
    status: 201,
    description: 'Artesano creado',
    type: ArtisanEntity,
  })
  create(@Body() data: CreateArtisanDto) {
    return this.artisanService.create(data);
  }

  /**
   * Lista todos los artesanos.
   * GET /artisans
   */
  @Get()
  @ApiOperation({ summary: 'Listar todos los artesanos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de artesanos',
    type: [ArtisanEntity],
  })
  findAll() {
    return this.artisanService.findAll();
  }

  /**
   * Obtiene un artesano por ID.
   * GET /artisans/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un artesano por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Artesano encontrado',
    type: ArtisanEntity,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.artisanService.findOne(id);
  }

  /**
   * Actualiza datos de un artesano.
   * PATCH /artisans/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un artesano' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateArtisanDto })
  @ApiResponse({
    status: 200,
    description: 'Artesano actualizado',
    type: ArtisanEntity,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateArtisanDto,
  ) {
    return this.artisanService.update(id, data);
  }

  /**
   * Elimina un artesano (solo si no tiene productos ni ventas).
   * DELETE /artisans/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un artesano' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Artesano eliminado',
    type: ArtisanEntity,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.artisanService.remove(id);
  }

  /**
   * Resumen profesional por artesano y evento.
   * GET /artisans/:id/summary?eventId=2
   */
  @Get(':id/summary')
  @ApiOperation({ summary: 'Resumen por artesano en un evento' })
  @ApiQuery({ name: 'eventId', type: Number, required: true })
  @ApiResponse({ status: 200, type: ArtisanSummarySwaggerDto })
  async getSummary(
    @Param('id', ParseIntPipe) id: number,
    @Query('eventId', ParseIntPipe) eventId: number,
  ): Promise<ArtisanSummarySwaggerDto> {
    return this.artisanService.getSummaryByEvent(id, eventId);
  }

  /**
   * Resumen contable detallado por artesano y evento.
   * GET /artisans/:id/contable-summary?eventId=2
   */
  @Get(':id/contable-summary')
  @ApiOperation({ summary: 'Resumen contable detallado por artesano y evento' })
  @ApiQuery({ name: 'eventId', type: Number, required: true })
  @ApiResponse({ status: 200, type: ArtisanSummaryContableDto })
  async getContableSummary(
    @Param('id', ParseIntPipe) id: number,
    @Query('eventId', ParseIntPipe) eventId: number,
  ): Promise<ArtisanSummaryContableDto> {
    return this.artisanService.getContableSummaryByEvent(id, eventId);
  }
}
