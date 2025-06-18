import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { SaleService } from './sales.service';
import { CreateSaleDto, CreateSaleSwaggerDto } from './dto/create-sale.dto';
import { UpdateSaleDto, UpdateSaleSwaggerDto } from './dto/update-sale.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Ventas')
@ApiBearerAuth() // <-- Documenta que requiere JWT
@UseGuards(JwtAuthGuard) // <-- Protege todas las rutas del controlador
@Controller('sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  @ApiOperation({ summary: 'Crear venta' })
  @ApiBody({ type: CreateSaleSwaggerDto })
  @ApiResponse({ status: 201, description: 'Venta creada', type: CreateSaleSwaggerDto })
  create(@Body() data: CreateSaleDto) {
    return this.saleService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ventas' })
  @ApiQuery({ name: 'eventId', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'artisanId', required: false, type: Number, example: 2 })
  @ApiQuery({ name: 'order', required: false, enum: ['date', 'quantity'], example: 'date' })
  @ApiResponse({ status: 200, description: 'Lista de ventas', type: [CreateSaleSwaggerDto] })
  findAll(
    @Query('eventId') eventId?: string,
    @Query('artisanId') artisanId?: string,
    @Query('order') order?: 'date' | 'quantity'
  ) {
    return this.saleService.findAll({
      eventId: eventId ? Number(eventId) : undefined,
      artisanId: artisanId ? Number(artisanId) : undefined,
      order,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener venta por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Venta encontrada', type: CreateSaleSwaggerDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.saleService.findOne(id);
  }
}