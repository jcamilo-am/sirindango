import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ProductChangeService } from './product-change.service';
import { CreateProductChangeDto, CreateProductChangeSwaggerDto } from './dto/create-product-change.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
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

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cambio por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Cambio encontrado', type: CreateProductChangeSwaggerDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productChangeService.findOne(id);
  }
}