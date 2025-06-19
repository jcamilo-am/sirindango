import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InventoryMovementService } from './inventory-movement.service';
import { CreateInventoryMovementDto, CreateInventoryMovementSwaggerDto } from './dto/create-inventory-movement.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
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

  @Get(':id')
  @ApiOperation({ summary: 'Obtener movimiento por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Movimiento encontrado', type: CreateInventoryMovementSwaggerDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryMovementService.findOne(id);
  }
}