import { Controller, Get, Query, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ProductService } from './products.service';
import { CreateProductDto, CreateProductSwaggerDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateProductSwaggerDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Productos')
@ApiBearerAuth() // Documenta que requiere JWT en Swagger
@UseGuards(JwtAuthGuard) // Protege todas las rutas del controlador
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Crea un producto y su movimiento de inventario inicial (ENTRADA).
   * La lógica de movimiento está en el servicio.
   */
  @Post()
  @ApiOperation({ summary: 'Crear producto' })
  @ApiBody({ type: CreateProductSwaggerDto })
  @ApiResponse({ status: 201, description: 'Producto creado', type: CreateProductSwaggerDto })
  create(@Body() data: CreateProductDto) {
    return this.productService.create(data);
  }

  /**
   * Lista productos con filtros opcionales por evento, artesano y orden.
   */
  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  @ApiQuery({ name: 'eventId', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'artisanId', required: false, type: Number, example: 2 })
  @ApiQuery({ name: 'order', required: false, enum: ['name', 'quantity'], example: 'name' })
  @ApiResponse({ status: 200, description: 'Lista de productos', type: [CreateProductSwaggerDto] })
  findAll(
    @Query('eventId') eventId?: string,
    @Query('artisanId') artisanId?: string,
    @Query('order') order?: 'name' | 'quantity'
  ) {
    return this.productService.findAll({
      eventId: eventId ? Number(eventId) : undefined,
      artisanId: artisanId ? Number(artisanId) : undefined,
      order,
    });
  }

  /**
   * Obtiene un producto por ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Producto encontrado', type: CreateProductSwaggerDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  /**
   * Actualiza un producto si no tiene ventas asociadas.
   * La validación está en el servicio.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateProductSwaggerDto })
  @ApiResponse({ status: 200, description: 'Producto actualizado', type: UpdateProductSwaggerDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProductDto) {
    return this.productService.update(id, data);
  }

  /**
   * Elimina un producto si no tiene ventas asociadas.
   * La validación está en el servicio.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Producto eliminado', type: CreateProductSwaggerDto })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}