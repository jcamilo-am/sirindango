import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { ProductChangeService } from './product-change.service';
import { CreateProductChangeDto, CreateProductChangeSwaggerDto } from './dto/create-product-change.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Cambios de Producto')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('product-changes')
export class ProductChangeController {
  constructor(private readonly productChangeService: ProductChangeService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar cambio de producto' })
  @ApiBody({ type: CreateProductChangeSwaggerDto })
  @ApiResponse({ status: 201, description: 'Cambio registrado', type: CreateProductChangeSwaggerDto })
  create(@Body() data: CreateProductChangeDto) {
    return this.productChangeService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cambios de productos' })
  @ApiQuery({ name: 'saleId', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'eventId', required: false, type: Number, example: 2 })
  @ApiQuery({ name: 'artisanId', required: false, type: Number, example: 3 })
  @ApiResponse({ status: 200, description: 'Lista de cambios', type: [CreateProductChangeSwaggerDto] })
  findAll(
    @Query('saleId') saleId?: string,
    @Query('eventId') eventId?: string,
    @Query('artisanId') artisanId?: string,
  ) {
    return this.productChangeService.findAll({
      saleId: saleId ? Number(saleId) : undefined,
      eventId: eventId ? Number(eventId) : undefined,
      artisanId: artisanId ? Number(artisanId) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cambio por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Cambio encontrado', type: CreateProductChangeSwaggerDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productChangeService.findOne(id);
  }
}