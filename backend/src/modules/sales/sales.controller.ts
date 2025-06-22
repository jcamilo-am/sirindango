import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { SaleService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateMultiSaleDto } from './dto/create-multi-sale.dto';
import { SaleEntity, SaleWithDetailsEntity, MultiSaleResultEntity } from './entities/sale.entity';
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

@ApiTags('Ventas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  /**
   * Crea una venta individual.
   */
  @Post('single')
  @ApiOperation({
    summary: 'Crear venta individual',
    description: 'Registra una venta de un solo producto con validaciones de negocio.',
  })
  @ApiBody({ type: CreateSaleDto })
  @ApiResponse({
    status: 201,
    description: 'Venta creada exitosamente',
    type: SaleEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o violación de reglas de negocio',
  })
  async createSale(@Body() createSaleDto: CreateSaleDto): Promise<SaleEntity> {
    return this.saleService.create(createSaleDto);
  }

  /**
   * Crea múltiples ventas en una sola transacción.
   */
  @Post()
  @ApiOperation({
    summary: 'Crear venta múltiple',
    description: 'Registra múltiples productos en una sola transacción de compra.',
  })
  @ApiBody({ type: CreateMultiSaleDto })
  @ApiResponse({
    status: 201,
    description: 'Ventas creadas exitosamente',
    type: [MultiSaleResultEntity],
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o violación de reglas de negocio',
  })
  async createMultiSale(@Body() createMultiSaleDto: CreateMultiSaleDto): Promise<MultiSaleResultEntity[]> {
    return this.saleService.createMultiSale(createMultiSaleDto);
  }

  /**
   * Lista ventas con filtros opcionales.
   */
  @Get()
  @ApiOperation({ 
    summary: 'Listar ventas',
    description: 'Obtiene todas las ventas con filtros opcionales por evento, artesano, método de pago, etc.',
  })
  @ApiQuery({ name: 'eventId', required: false, type: Number, description: 'ID del evento' })
  @ApiQuery({ name: 'artisanId', required: false, type: Number, description: 'ID del artesano' })
  @ApiQuery({ name: 'paymentMethod', required: false, enum: ['CASH', 'CARD'], description: 'Método de pago' })
  @ApiQuery({ name: 'state', required: false, enum: ['ACTIVE', 'CANCELLED'], description: 'Estado de la venta' })
  @ApiQuery({ name: 'order', required: false, enum: ['date', 'quantity'], description: 'Ordenar por fecha o cantidad' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ventas obtenida exitosamente',
    type: [SaleEntity],
  })
  async findAll(
    @Query('eventId') eventId?: string,
    @Query('artisanId') artisanId?: string,
    @Query('paymentMethod') paymentMethod?: 'CASH' | 'CARD',
    @Query('state') state?: 'ACTIVE' | 'CANCELLED',
    @Query('order') order?: 'date' | 'quantity',
  ): Promise<SaleEntity[]> {
    return this.saleService.findAll({
      eventId: eventId ? Number(eventId) : undefined,
      artisanId: artisanId ? Number(artisanId) : undefined,
      paymentMethod,
      state,
      order,
    });
  }

  /**
   * Obtiene una venta por ID.
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener venta por ID',
    description: 'Obtiene los detalles de una venta específica.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la venta' })
  @ApiResponse({
    status: 200,
    description: 'Venta encontrada exitosamente',
    type: SaleEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Venta no encontrada',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SaleEntity> {
    return this.saleService.findOne(id);
  }

  /**
   * Obtiene una venta con detalles de relaciones.
   */
  @Get(':id/details')
  @ApiOperation({ 
    summary: 'Obtener venta con detalles',
    description: 'Obtiene una venta con información detallada de producto, artesano y evento.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la venta' })
  @ApiResponse({
    status: 200,
    description: 'Venta con detalles encontrada exitosamente',
    type: SaleWithDetailsEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Venta no encontrada',
  })
  async findOneWithDetails(@Param('id', ParseIntPipe) id: number): Promise<SaleWithDetailsEntity> {
    return this.saleService.findOneWithDetails(id);
  }

  /**
   * Cancela una venta por ID.
   */
  @Patch(':id/cancel')
  @ApiOperation({ 
    summary: 'Cancelar venta',
    description: 'Cancela una venta activa y revierte el stock si aplica.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la venta a cancelar' })
  @ApiResponse({ 
    status: 200, 
    description: 'Venta cancelada exitosamente',
    type: SaleEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede cancelar la venta (estado inválido o evento cerrado)',
  })
  @ApiResponse({
    status: 404,
    description: 'Venta no encontrada',
  })
  async cancelSale(@Param('id', ParseIntPipe) id: number): Promise<SaleEntity> {
    return this.saleService.cancelSale(id);
  }

  /**
   * Obtiene estadísticas de ventas por artesano.
   */
  @Get('stats/artisan/:artisanId')
  @ApiOperation({ 
    summary: 'Estadísticas de ventas por artesano',
    description: 'Obtiene estadísticas detalladas de ventas de un artesano específico.',
  })
  @ApiParam({ name: 'artisanId', type: Number, description: 'ID del artesano' })
  @ApiQuery({ name: 'eventId', required: false, type: Number, description: 'ID del evento (opcional)' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getArtisanStats(
    @Param('artisanId', ParseIntPipe) artisanId: number,
    @Query('eventId') eventId?: string,
  ) {
    return this.saleService.getArtisanStats(artisanId, eventId ? Number(eventId) : undefined);
  }

  /**
   * Obtiene estadísticas de ventas por evento.
   */
  @Get('stats/event/:eventId')
  @ApiOperation({ 
    summary: 'Estadísticas de ventas por evento',
    description: 'Obtiene estadísticas detalladas de ventas de un evento específico.',
  })
  @ApiParam({ name: 'eventId', type: Number, description: 'ID del evento' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getEventStats(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.saleService.getEventStats(eventId);
  }

  /**
   * Obtiene productos más vendidos de un evento.
   */
  @Get('stats/top-products/:eventId')
  @ApiOperation({ 
    summary: 'Productos más vendidos por evento',
    description: 'Obtiene los productos más vendidos de un evento específico.',
  })
  @ApiParam({ name: 'eventId', type: Number, description: 'ID del evento' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de resultados (default: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Top productos obtenidos exitosamente',
  })
  async getTopSellingProducts(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Query('limit') limit?: string,
  ) {
    return this.saleService.getTopSellingProducts(eventId, limit ? Number(limit) : 10);
  }
}
