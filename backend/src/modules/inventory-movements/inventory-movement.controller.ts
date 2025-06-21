import { Controller, Get, Query, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InventoryMovementService } from './inventory-movement.service';
import { CreateInventoryMovementDto, CreateInventoryMovementSwaggerDto } from './dto/create-inventory-movement.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Movimientos de Inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory-movements')
export class InventoryMovementController {
  constructor(private readonly inventoryMovementService: InventoryMovementService) {}

  @Post()
  @ApiOperation({ summary: 'Crear movimiento de inventario' })
  @ApiBody({ type: CreateInventoryMovementSwaggerDto })
  @ApiResponse({ status: 201, description: 'Movimiento creado', type: CreateInventoryMovementSwaggerDto })
  create(@Body() data: CreateInventoryMovementDto) {
    return this.inventoryMovementService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar movimientos de inventario' })
  @ApiQuery({ name: 'productId', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'type', required: false, enum: ['ENTRADA', 'SALIDA'], example: 'ENTRADA' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-12-31' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos', type: [CreateInventoryMovementSwaggerDto] })
  findAll(
    @Query('productId') productId?: string,
    @Query('type') type?: 'ENTRADA' | 'SALIDA',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.inventoryMovementService.findAll({
      productId: productId ? Number(productId) : undefined,
      type,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener movimiento por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Movimiento encontrado', type: CreateInventoryMovementSwaggerDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryMovementService.findOne(id);
  }
}