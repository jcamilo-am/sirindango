import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { InventoryMovementService } from './inventory-movement.service';
import {
  CreateInventoryMovementDto,
  CreateInventoryMovementSwaggerDto,
  InventoryMovementFiltersDto,
  GetInventoryMovementParamsDto,
  InventoryMovementStatsParamsDto,
} from './dto/inventory-movement.dto';
import {
  InventoryMovementResponseEntity,
  InventoryMovementDetailedResponseEntity,
} from './entities/inventory-movement-response.entity';
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

@ApiTags('Movimientos de Inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory-movements')
export class InventoryMovementController {
  constructor(
    private readonly inventoryMovementService: InventoryMovementService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear movimiento de inventario' })
  @ApiBody({ type: CreateInventoryMovementSwaggerDto })
  @ApiResponse({
    status: 201,
    description: 'Movimiento creado exitosamente',
    type: InventoryMovementResponseEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación o datos incorrectos',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto, venta o cambio no encontrado',
  })
  async create(@Body() data: CreateInventoryMovementDto): Promise<InventoryMovementResponseEntity> {
    return this.inventoryMovementService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar movimientos de inventario con filtros y paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Elementos por página' })
  @ApiQuery({ name: 'productId', required: false, type: Number, example: 1, description: 'Filtrar por producto' })
  @ApiQuery({ name: 'type', required: false, enum: ['ENTRADA', 'SALIDA'], example: 'ENTRADA', description: 'Tipo de movimiento' })
  @ApiQuery({ name: 'saleId', required: false, type: Number, example: 2, description: 'Filtrar por venta' })
  @ApiQuery({ name: 'changeId', required: false, type: Number, example: 3, description: 'Filtrar por cambio' })
  @ApiQuery({ name: 'eventId', required: false, type: Number, example: 4, description: 'Filtrar por evento' })
  @ApiQuery({ name: 'artisanId', required: false, type: Number, example: 5, description: 'Filtrar por artesano' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01', description: 'Fecha de inicio' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-12-31', description: 'Fecha de fin' })
  @ApiResponse({
    status: 200,
    description: 'Lista de movimientos con paginación',
    schema: {
      properties: {
        movements: { type: 'array', items: { $ref: '#/components/schemas/InventoryMovementDetailedResponseEntity' } },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('productId') productId?: string,
    @Query('type') type?: 'ENTRADA' | 'SALIDA',
    @Query('saleId') saleId?: string,
    @Query('changeId') changeId?: string,
    @Query('eventId') eventId?: string,
    @Query('artisanId') artisanId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.inventoryMovementService.findAll({
      page: Number(page),
      limit: Number(limit),
      productId: productId ? Number(productId) : undefined,
      type,
      saleId: saleId ? Number(saleId) : undefined,
      changeId: changeId ? Number(changeId) : undefined,
      eventId: eventId ? Number(eventId) : undefined,
      artisanId: artisanId ? Number(artisanId) : undefined,
      startDate,
      endDate,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de movimientos de inventario' })
  @ApiQuery({ name: 'eventId', required: false, type: Number, example: 1, description: 'Filtrar por evento' })
  @ApiQuery({ name: 'artisanId', required: false, type: Number, example: 2, description: 'Filtrar por artesano' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2024-01-01', description: 'Fecha de inicio' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2024-12-31', description: 'Fecha de fin' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de movimientos',
    schema: {
      properties: {
        totalMovements: { type: 'number' },
        totalEntradas: { type: 'number' },
        totalSalidas: { type: 'number' },
        totalQuantityEntradas: { type: 'number' },
        totalQuantitySalidas: { type: 'number' },
        netQuantity: { type: 'number' },
      },
    },
  })
  async getStats(
    @Query('eventId') eventId?: string,
    @Query('artisanId') artisanId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.inventoryMovementService.getStats({
      eventId: eventId ? Number(eventId) : undefined,
      artisanId: artisanId ? Number(artisanId) : undefined,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener movimiento por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'ID del movimiento' })
  @ApiResponse({
    status: 200,
    description: 'Movimiento encontrado',
    type: InventoryMovementDetailedResponseEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Movimiento no encontrado',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryMovementDetailedResponseEntity> {
    return this.inventoryMovementService.findOne(id);
  }
}
