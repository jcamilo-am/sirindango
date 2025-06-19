import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { SaleService } from './sales.service';
import { CreateMultiSaleDto } from './dto/create-multi-sale.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Ventas')
@ApiBearerAuth() // Documenta que requiere JWT en Swagger
@UseGuards(JwtAuthGuard) // Protege todas las rutas del controlador
@Controller('sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  /**
   * Crea una venta.
   * La lógica de validación, movimiento de inventario y stock está en el servicio.
   */
  @Post()
  @ApiOperation({ summary: 'Crear venta (uno o varios productos en una sola compra)' })
  @ApiBody({ type: CreateMultiSaleDto })
  @ApiResponse({ status: 201, description: 'Venta creada', type: CreateMultiSaleDto })
  async createMultiSale(@Body() data: CreateMultiSaleDto) {
    return this.saleService.createMultiSale(data);
  }

  /**
   * Lista ventas con filtros opcionales por evento, artesano y orden.
   */
  @Get()
  @ApiOperation({ summary: 'Listar ventas' })
  @ApiQuery({ name: 'eventId', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'artisanId', required: false, type: Number, example: 2 })
  @ApiQuery({ name: 'order', required: false, enum: ['date', 'quantity'], example: 'date' })
  @ApiResponse({ status: 200, description: 'Lista de ventas', type: [CreateMultiSaleDto] })
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

  /**
   * Obtiene una venta por ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener venta por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Venta encontrada', type: CreateMultiSaleDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.saleService.findOne(id);
  }
}