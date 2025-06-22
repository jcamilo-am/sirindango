import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductChangeService } from './product-change.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateProductChangeDto,
  CreateProductChangeSwaggerDto,
  ListProductChangesQueryDto,
  ListProductChangesQuerySwaggerDto,
} from './dto/product-change.dto';
import {
  ProductChangeResponseEntity,
  ProductChangeCreationResponseEntity,
  ProductChangeDetailedResponseEntity,
  ProductChangeListResponseEntity,
} from './entities/product-change-response.entity';

@ApiTags('Cambios de Producto')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('product-changes')
export class ProductChangeController {
  constructor(private readonly productChangeService: ProductChangeService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Registrar cambio de producto',
    description: 'Registra un cambio de producto, creando los movimientos de inventario correspondientes'
  })
  @ApiBody({ type: CreateProductChangeSwaggerDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cambio de producto registrado exitosamente',
    type: ProductChangeCreationResponseEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos o reglas de negocio no cumplidas',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venta o productos no encontrados',
  })
  async create(@Body() data: CreateProductChangeDto): Promise<ProductChangeCreationResponseEntity> {
    return await this.productChangeService.create(data);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar cambios de producto',
    description: 'Obtiene una lista paginada de cambios de producto con filtros opcionales'
  })
  @ApiQuery({ type: ListProductChangesQuerySwaggerDto, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de cambios de producto obtenida exitosamente',
    type: ProductChangeListResponseEntity,
  })
  async findMany(@Query() query: ListProductChangesQueryDto): Promise<ProductChangeListResponseEntity> {
    return await this.productChangeService.findMany(query);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener cambio de producto por ID',
    description: 'Obtiene la información básica de un cambio de producto específico'
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    example: 1,
    description: 'ID único del cambio de producto'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cambio de producto encontrado',
    type: ProductChangeResponseEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cambio de producto no encontrado',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductChangeResponseEntity> {
    return await this.productChangeService.findOne(id);
  }

  @Get(':id/detailed')
  @ApiOperation({ 
    summary: 'Obtener cambio de producto detallado',
    description: 'Obtiene información completa de un cambio de producto incluyendo datos relacionados'
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    example: 1,
    description: 'ID único del cambio de producto'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Información detallada del cambio de producto',
    type: ProductChangeDetailedResponseEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cambio de producto no encontrado',
  })
  async findOneDetailed(@Param('id', ParseIntPipe) id: number): Promise<ProductChangeDetailedResponseEntity> {
    return await this.productChangeService.findOneDetailed(id);
  }

  @Get(':id/inventory-movements')
  @ApiOperation({ 
    summary: 'Obtener movimientos de inventario',
    description: 'Obtiene el historial de movimientos de inventario asociados a un cambio de producto'
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    example: 1,
    description: 'ID único del cambio de producto'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Movimientos de inventario del cambio',
  })
  async getInventoryMovements(@Param('id', ParseIntPipe) id: number) {
    return await this.productChangeService.getInventoryMovements(id);
  }

  @Get('by-sale/:saleId')
  @ApiOperation({ 
    summary: 'Obtener cambios por venta',
    description: 'Obtiene todos los cambios de producto asociados a una venta específica'
  })
  @ApiParam({ 
    name: 'saleId', 
    type: Number, 
    example: 1,
    description: 'ID único de la venta'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cambios de producto de la venta',
    type: [ProductChangeResponseEntity],
  })
  async findBySale(@Param('saleId', ParseIntPipe) saleId: number): Promise<ProductChangeResponseEntity[]> {
    return await this.productChangeService.findBySale(saleId);
  }

  @Get('sale/:saleId/has-changes')
  @ApiOperation({ 
    summary: 'Verificar si una venta tiene cambios',
    description: 'Verifica si una venta específica tiene cambios de producto registrados'
  })
  @ApiParam({ 
    name: 'saleId', 
    type: Number, 
    example: 1,
    description: 'ID único de la venta'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado de la verificación',
    schema: {
      type: 'object',
      properties: {
        hasChanges: { type: 'boolean', example: true },
        saleId: { type: 'number', example: 1 }
      }
    }
  })
  async hasProductChanges(@Param('saleId', ParseIntPipe) saleId: number) {
    const hasChanges = await this.productChangeService.hasProductChanges(saleId);
    return { hasChanges, saleId };
  }

  @Get('event/:eventId/stats')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de cambios por evento',
    description: 'Obtiene estadísticas agregadas de cambios de producto para un evento específico'
  })
  @ApiParam({ 
    name: 'eventId', 
    type: Number, 
    example: 1,
    description: 'ID único del evento'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas de cambios del evento',
  })
  async getEventStats(@Param('eventId', ParseIntPipe) eventId: number) {
    return await this.productChangeService.getEventStats(eventId);
  }
}
