import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './types/create-product.type';
import { UpdateProductInput } from './types/update-product.type';
import { FindAllOptions } from './types/filters.type';
import { getEventStatus } from '../events/utils/event-status.util';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // Calcula el stock sumando movimientos usando el cliente recibido
  private async getCurrentStockWithClient(productId: number, prisma: any) {
    const entradas = await prisma.inventoryMovement.aggregate({
      where: { productId, type: 'ENTRADA' },
      _sum: { quantity: true },
    });
    const salidas = await prisma.inventoryMovement.aggregate({
      where: { productId, type: 'SALIDA' },
      _sum: { quantity: true },
    });
    return (entradas._sum.quantity ?? 0) - (salidas._sum.quantity ?? 0);
  }

  // Crea un producto y su movimiento de inventario inicial
  async create(data: CreateProductInput) {
    await this.validateEventEditable(data.eventId);

    // Valida evento y artesano
    await this.validateEvent({ eventId: data.eventId });
    const artisan = await this.prisma.artisan.findUnique({ where: { id: data.artisanId } });
    if (!artisan) throw new NotFoundException('El artesano no existe');
    if (artisan.active === false) throw new BadRequestException('El artesano no está activo');

    // Valida unicidad de nombre por artesano y evento
    const exists = await this.prisma.product.findFirst({
      where: { name: data.name, eventId: data.eventId, artisanId: data.artisanId }
    });
    if (exists) throw new BadRequestException('Ya existe un producto con ese nombre para este artesano en este evento.');

    return await this.prisma.$transaction(async (tx) => {
      const { initialQuantity, ...productData } = data;
      const product = await tx.product.create({ data: productData });

      await tx.inventoryMovement.create({
        data: {
          type: 'ENTRADA',
          quantity: initialQuantity,
          reason: 'Carga inicial',
          productId: product.id,
        },
      });

      const stock = await this.getCurrentStockWithClient(product.id, tx);
      return { ...product, stock };
    });
  }

  // Para métodos fuera de transacción, usa this.prisma
  async getCurrentStock(productId: number) {
    const entradas = await this.prisma.inventoryMovement.aggregate({
      where: { productId, type: 'ENTRADA' },
      _sum: { quantity: true },
    });
    const salidas = await this.prisma.inventoryMovement.aggregate({
      where: { productId, type: 'SALIDA' },
      _sum: { quantity: true },
    });
    return (entradas._sum.quantity ?? 0) - (salidas._sum.quantity ?? 0);
  }

  // Busca productos con filtros opcionales y retorna el stock calculado
  async findAll(options: FindAllOptions = {}) {
    const { eventId, artisanId, order } = options;
    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (artisanId) where.artisanId = artisanId;

    // Solo incluir productos de eventos no cerrados
    where.event = { state: { not: 'CLOSED' } };

    let orderBy: any = undefined;
    if (order === 'name') orderBy = { name: 'asc' };

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      include: { event: true }
    });

    // Agrega el stock calculado a cada producto
    return Promise.all(products.map(async (product) => ({
      ...product,
      stock: await this.getCurrentStock(product.id),
    })));
  }

  // Busca un producto por ID, lanza NotFoundException si no existe, retorna stock calculado
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('El producto no existe');
    const stock = await this.getCurrentStock(product.id);
    return { ...product, stock };
  }

  // Actualiza un producto y su movimiento de inventario inicial
  async update(id: number, data: UpdateProductInput) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('El producto no existe');
    await this.validateEventEditable(data.eventId ?? product.eventId);

    // Valida unicidad de nombre por artesano y evento si cambia el nombre
    if (data.name) {
      const exists = await this.prisma.product.findFirst({
        where: {
          name: data.name,
          eventId: data.eventId ?? product.eventId,
          artisanId: data.artisanId ?? product.artisanId,
          NOT: { id }
        }
      });
      if (exists) throw new BadRequestException('Ya existe un producto con ese nombre para este artesano en este evento.');
    }

    // Valida evento y artesano si cambian
    if (data.eventId) await this.validateEvent({ eventId: data.eventId });
    if (data.artisanId) {
      const artisan = await this.prisma.artisan.findUnique({ where: { id: data.artisanId } });
      if (!artisan) throw new NotFoundException('El artesano no existe');
      if (artisan.active === false) throw new BadRequestException('El artesano no está activo');
    }

    try {
      const updatedProduct = await this.prisma.product.update({ where: { id }, data });
      const stock = await this.getCurrentStock(id);
      return { ...updatedProduct, stock };
    } catch (error) {
      throw error;
    }
  }

  // Elimina un producto solo si no tiene movimientos de inventario
  async remove(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('El producto no existe');
    await this.validateEventEditable(product.eventId);

    const movementsCount = await this.prisma.inventoryMovement.count({ where: { productId: id } });
    if (movementsCount > 0) {
      throw new BadRequestException('No se puede eliminar un producto con movimientos de inventario.');
    }
    try {
      return await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      throw error;
    }
  }

  // Valida que el evento esté en estado 'SCHEDULED' para permitir ediciones
  async validateEventEditable(eventId: number) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('El evento no existe');
    const status = getEventStatus(event);
    if (status !== 'SCHEDULED') {
      throw new BadRequestException('Solo puedes modificar productos antes de que el evento inicie.');
    }
  }

  // Ejemplo en ProductService y SaleService
  async validateEvent(data: any) {
    const event = await this.prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new NotFoundException('El evento no existe');
    const status = getEventStatus(event);
    if (status !== 'ACTIVE') throw new BadRequestException('No se pueden registrar productos/ventas en un evento cerrado o no iniciado');
  }
}