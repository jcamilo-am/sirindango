import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { CreateMultiSaleDto } from './dto/create-multi-sale.dto';
import { 
  SaleEntity, 
  SaleWithDetailsEntity, 
  MultiSaleResultEntity 
} from './entities/sale.entity';
import { SaleValidationHelper } from './helpers/sale-validation.helper';
import { SaleCalculationHelper } from './helpers/sale-calculation.helper';
import { EventStatsHelper } from '../events/helpers/event-stats.helper';

@Injectable()
export class SaleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una venta individual.
   */
  async create(data: CreateSaleDto): Promise<SaleEntity> {
    // Validaciones usando helpers
    await SaleValidationHelper.validateEventForSale(this.prisma, data.eventId);
    await SaleValidationHelper.validateArtisanForSale(this.prisma, data.artisanId);
    const product = await SaleValidationHelper.validateProductForSale(
      this.prisma, 
      data.productId, 
      data.eventId
    );
    
    SaleValidationHelper.validateSaleData({
      quantitySold: data.quantitySold,
      valueCharged: data.valueCharged,
      paymentMethod: data.paymentMethod,
      cardFee: data.cardFee,
    });

    // Validar que el producto pertenezca al artesano especificado
    if (product.artisanId !== data.artisanId) {
      throw new BadRequestException('El producto no pertenece al artesano especificado');
    }

    // Validar stock disponible si existe inventario
    await this.validateStockAvailability(data.productId, data.quantitySold);

    // Crear la venta en transacción para asegurar integridad
    return await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          eventId: data.eventId,
          productId: data.productId,
          artisanId: data.artisanId,
          quantitySold: data.quantitySold,
          valueCharged: data.valueCharged,
          paymentMethod: data.paymentMethod,
          cardFee: data.cardFee || 0,
          state: 'ACTIVE',
        },
      });

      // Registrar movimiento de inventario si se maneja stock
      await this.createInventoryMovement(tx, {
        type: 'SALIDA',
        quantity: data.quantitySold,
        reason: 'Venta directa',
        productId: data.productId,
        saleId: sale.id,
      });

      return SaleEntity.fromPrisma(sale);
    });
  }

  /**
   * Crea múltiples ventas en una sola transacción.
   */
  async createMultiSale(data: CreateMultiSaleDto): Promise<MultiSaleResultEntity[]> {
    const { eventId, paymentMethod, cardFeeTotal = 0, items } = data;

    // Validaciones usando helpers
    await SaleValidationHelper.validateEventForSale(this.prisma, eventId);
    
    const productIds = items.map(item => item.productId);
    const artisanIds = items.map(item => item.artisanId);
    
    const products = await SaleValidationHelper.validateMultiSaleProducts(
      this.prisma, 
      eventId, 
      productIds
    );
    
    await SaleValidationHelper.validateMultiSaleArtisans(this.prisma, artisanIds);

    // Calcular valores con helpers
    const itemsWithValue = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException('Producto no encontrado');
      
      // Validar que el producto pertenezca al artesano
      if (product.artisanId !== item.artisanId) {
        throw new BadRequestException(`El producto ${product.name} no pertenece al artesano especificado`);
      }
      
      return {
        ...item,
        valueCharged: SaleCalculationHelper.calculateValueCharged(product.price, item.quantitySold),
      };
    });

    // Calcular fees prorrateados
    const itemsWithFees = SaleCalculationHelper.calculateProportionalCardFee(
      itemsWithValue, 
      paymentMethod === 'CARD' ? cardFeeTotal : 0
    );

    // Crear cada venta individualmente
    const results: MultiSaleResultEntity[] = [];
    for (const item of itemsWithFees) {
      const sale = await this.create({
        eventId,
        productId: item.productId,
        artisanId: item.artisanId,
        quantitySold: item.quantitySold,
        valueCharged: item.valueCharged,
        paymentMethod,
        cardFee: item.cardFee,
      });
      
      results.push(MultiSaleResultEntity.fromSaleAndAmount(sale, sale.valueCharged));
    }
    
    return results;
  }

  /**
   * Lista todas las ventas con filtros opcionales.
   */
  async findAll(options: {
    eventId?: number;
    artisanId?: number;
    paymentMethod?: 'CASH' | 'CARD';
    state?: 'ACTIVE' | 'CANCELLED';
    startDate?: Date;
    endDate?: Date;
    order?: 'date' | 'quantity';
  } = {}): Promise<SaleEntity[]> {
    const { eventId, artisanId, paymentMethod, state, startDate, endDate, order } = options;
    
    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (artisanId) where.artisanId = artisanId;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (state) where.state = state;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (order === 'date') orderBy = { date: 'asc' };
    if (order === 'quantity') orderBy = { quantitySold: 'asc' };

    const sales = await this.prisma.sale.findMany({
      where,
      orderBy,
    });

    return SaleEntity.fromPrismaList(sales);
  }

  /**
   * Busca una venta por ID.
   */
  async findOne(id: number): Promise<SaleEntity> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
    });
    
    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    return SaleEntity.fromPrisma(sale);
  }

  /**
   * Busca una venta con detalles de relaciones.
   */
  async findOneWithDetails(id: number): Promise<SaleWithDetailsEntity> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        product: true,
        artisan: true,
        event: true,
      },
    });
    
    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    return SaleWithDetailsEntity.fromPrismaWithDetails(sale);
  }

  /**
   * Actualiza una venta por ID.
   */
  async update(id: number, data: UpdateSaleDto): Promise<SaleEntity> {
    // Verificar que la venta existe
    await SaleValidationHelper.validateSaleExists(this.prisma, id);

    // Validar datos si se proporcionan
    if (data.quantitySold || data.valueCharged || data.paymentMethod || data.cardFee !== undefined) {
      const existingSale = await this.prisma.sale.findUnique({ where: { id } });
      if (!existingSale) {
        throw new NotFoundException('Venta no encontrada');
      }

      SaleValidationHelper.validateSaleData({
        quantitySold: data.quantitySold || existingSale.quantitySold,
        valueCharged: data.valueCharged || existingSale.valueCharged,
        paymentMethod: data.paymentMethod || existingSale.paymentMethod,
        cardFee: data.cardFee !== undefined ? data.cardFee : (existingSale.cardFee || 0),
      });
    }

    const updatedSale = await this.prisma.sale.update({
      where: { id },
      data,
    });

    return SaleEntity.fromPrisma(updatedSale);
  }

  /**
   * Cancela una venta (cambia el estado a CANCELLED).
   */
  async cancelSale(id: number): Promise<SaleEntity> {
    // Validar que se puede cancelar la venta
    await SaleValidationHelper.validateCanCancelSale(this.prisma, id);

    // Validar que el evento esté activo para permitir cancelaciones
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    const eventStatus = EventStatsHelper.getEventStatus(sale.event);
    if (eventStatus !== 'ACTIVE') {
      throw new BadRequestException(
        'Solo se pueden cancelar ventas de eventos activos'
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      const cancelledSale = await tx.sale.update({
        where: { id },
        data: { state: 'CANCELLED' },
      });

      // Registrar movimiento de entrada para devolver el stock
      await this.createInventoryMovement(tx, {
        type: 'ENTRADA',
        quantity: sale.quantitySold,
        reason: 'Cancelación de venta',
        productId: sale.productId,
        saleId: sale.id,
      });

      return SaleEntity.fromPrisma(cancelledSale);
    });
  }

  /**
   * Elimina una venta (solo si está cancelada).
   */
  async remove(id: number): Promise<SaleEntity> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    if (sale.state !== 'CANCELLED') {
      throw new BadRequestException('Solo se pueden eliminar ventas canceladas');
    }

    const deletedSale = await this.prisma.sale.delete({
      where: { id },
    });

    return SaleEntity.fromPrisma(deletedSale);
  }

  /**
   * Obtiene estadísticas de ventas de un artesano.
   */
  async getArtisanStats(artisanId: number, eventId?: number) {
    await SaleValidationHelper.validateArtisanForSale(this.prisma, artisanId);
    return SaleCalculationHelper.calculateArtisanSalesStats(this.prisma, artisanId, eventId);
  }

  /**
   * Obtiene estadísticas de ventas de un evento.
   */
  async getEventStats(eventId: number) {
    await SaleValidationHelper.validateEventForSale(this.prisma, eventId);
    return SaleCalculationHelper.calculateEventSalesStats(this.prisma, eventId);
  }

  /**
   * Obtiene ventas agrupadas por fecha.
   */
  async getSalesByDateRange(startDate: Date, endDate: Date, eventId?: number) {
    if (eventId) {
      await SaleValidationHelper.validateEventForSale(this.prisma, eventId);
    }
    return SaleCalculationHelper.calculateSalesByDateRange(this.prisma, startDate, endDate, eventId);
  }

  /**
   * Obtiene los productos más vendidos de un evento.
   */
  async getTopSellingProducts(eventId: number, limit: number = 10) {
    await SaleValidationHelper.validateEventForSale(this.prisma, eventId);
    return SaleCalculationHelper.calculateTopSellingProducts(this.prisma, eventId, limit);
  }

  /**
   * Valida disponibilidad de stock usando movimientos de inventario.
   */
  private async validateStockAvailability(productId: number, quantityRequested: number): Promise<void> {
    const currentStock = await this.getCurrentStock(productId);
    
    if (currentStock < quantityRequested) {
      throw new BadRequestException('No hay suficiente stock disponible');
    }
  }

  /**
   * Obtiene el stock actual de un producto sumando movimientos.
   */
  private async getCurrentStock(productId: number): Promise<number> {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: { productId },
      select: { type: true, quantity: true },
    });

    let stock = 0;
    for (const movement of movements) {
      if (movement.type === 'ENTRADA') stock += movement.quantity;
      if (movement.type === 'SALIDA') stock -= movement.quantity;
    }
    return stock;
  }

  /**
   * Crea un movimiento de inventario.
   */
  private async createInventoryMovement(
    tx: any, 
    data: {
      type: 'ENTRADA' | 'SALIDA';
      quantity: number;
      reason: string;
      productId: number;
      saleId: number;
    }
  ): Promise<void> {
    try {
      await tx.inventoryMovement.create({
        data,
      });
    } catch (error) {
      // Si la tabla no existe o hay un error, continuar sin registrar el movimiento
      // Esto permite que el sistema funcione sin el módulo de inventario
      console.warn('No se pudo registrar el movimiento de inventario:', error);
    }
  }
}
