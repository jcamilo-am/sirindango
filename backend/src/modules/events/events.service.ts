import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEventType } from './types/create-event.type';
import { UpdateEventType } from './types/update-event.type';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { EventSummaryDto } from './dto/event-summary.dto';
import {
  EventAccountingSummaryDto,
  EventArtisanSaleDetailDto,
  EventArtisanAccountingSummaryDto,
} from './dto/event-accounting-summary.dto';
import { getEventStatus } from './utils/event-status.util';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  // Agrega el estado al evento según la fecha actual
  private addStatus(event: any) {
    return { ...event, status: getEventStatus(event) };
  }

  // Crea un evento y agrega el estado
  async create(data: CreateEventType) {
    try {
      const event = await this.prisma.event.create({ data });
      return this.addStatus(event);
    } catch (error) {
      // El filtro global manejará errores de unicidad, etc.
      throw error;
    }
  }

  // Devuelve todos los eventos con su estado
  async findAll() {
    const events = await this.prisma.event.findMany();
    return events.map((event) => this.addStatus(event));
  }

  // Busca un evento por ID, lanza NotFoundException si no existe
  async findOne(id: number) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('El evento no existe');
    return this.addStatus(event);
  }

  // Actualiza un evento, lanza NotFoundException si no existe
  async update(id: number, data: UpdateEventType) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('El evento no existe');

    const status = getEventStatus(event);

    // Solo permite editar si está SCHEDULED
    if (status !== 'SCHEDULED') {
      throw new BadRequestException(
        'Solo puedes editar eventos que aún no han iniciado.',
      );
    }

    // Busca si hay ventas asociadas a este evento
    const ventasCount = await this.prisma.sale.count({
      where: { eventId: id },
    });

    // Si hay ventas, solo permite cambiar nombre o ubicación
    if (ventasCount > 0) {
      const allowedFields = ['name', 'location'];
      const keys = Object.keys(data);

      // Si intenta cambiar algo más, rechaza la operación
      const invalidFields = keys.filter((k) => !allowedFields.includes(k));
      if (invalidFields.length > 0) {
        throw new BadRequestException(
          `No puedes modificar ${invalidFields.join(', ')} porque el evento ya tiene ventas registradas.`,
        );
      }
    } else {
      // Si no hay ventas, valida fechas y comisiones
      if (data.startDate || data.endDate) {
        const newStart = data.startDate ?? event.startDate;
        const newEnd = data.endDate ?? event.endDate;

        if (newStart > newEnd) {
          throw new BadRequestException(
            'La fecha de inicio no puede ser posterior a la fecha de fin.',
          );
        }
      }

      // Valida comisiones si se intentan cambiar
      if (
        data.commissionAssociation !== undefined &&
        (data.commissionAssociation < 0 || data.commissionAssociation > 100)
      ) {
        throw new BadRequestException(
          'La comisión de la asociación debe estar entre 0 y 100.',
        );
      }
      if (
        data.commissionSeller !== undefined &&
        (data.commissionSeller < 0 || data.commissionSeller > 100)
      ) {
        throw new BadRequestException(
          'La comisión del vendedor debe estar entre 0 y 100.',
        );
      }
    }

    // Realiza la actualización
    try {
      const updated = await this.prisma.event.update({ where: { id }, data });
      return this.addStatus(updated);
    } catch (error) {
      throw error;
    }
  }

  // Busca eventos por nombre (insensible a mayúsculas/minúsculas)
  async findByName(name: string) {
    const events = await this.prisma.event.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
    });
    return events.map((event) => this.addStatus(event));
  }

  // Devuelve el resumen del evento, lanza NotFoundException si no existe
  async getEventSummary(eventId: number): Promise<
    EventSummaryDto & {
      sellerCommission: number;
      mostSoldProduct: {
        productId: number;
        name: string;
        quantitySold: number;
      } | null;
      topArtisan: { artisanId: number; name: string; totalSold: number } | null;
      cardFeesTotal: number;
    }
  > {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('El evento no existe');

    // Obtén todas las ventas del evento
    const sales = await this.prisma.sale.findMany({
      where: { eventId },
      include: { product: true, artisan: true },
    });

    // Totales por método de pago y total de ventas
    const paymentTotals = { CASH: 0, CARD: 0 };
    let totalSales = 0;
    let cardFeesTotal = 0;

    // Agrupación para producto más vendido y artesano top
    const productSalesMap = new Map<
      number,
      { name: string; quantitySold: number }
    >();
    const artisanSalesMap = new Map<
      number,
      { name: string; totalSold: number }
    >();

    for (const sale of sales) {
      const saleTotal = sale.valueCharged;
      paymentTotals[sale.paymentMethod] += saleTotal;
      totalSales += saleTotal;

      // Suma fee de datafono si aplica
      if (sale.paymentMethod === 'CARD' && sale.cardFee) {
        cardFeesTotal += sale.cardFee;
      }

      // Agrupa por producto
      if (!productSalesMap.has(sale.productId)) {
        productSalesMap.set(sale.productId, {
          name: sale.product.name,
          quantitySold: 0,
        });
      }
      productSalesMap.get(sale.productId)!.quantitySold += sale.quantitySold;

      // Agrupa por artesano
      if (!artisanSalesMap.has(sale.artisanId)) {
        artisanSalesMap.set(sale.artisanId, {
          name: sale.artisan.name,
          totalSold: 0,
        });
      }
      artisanSalesMap.get(sale.artisanId)!.totalSold += saleTotal;
    }

    // Producto más vendido
    let mostSoldProduct: {
      productId: number;
      name: string;
      quantitySold: number;
    } | null = null;
    for (const [
      productId,
      { name, quantitySold },
    ] of productSalesMap.entries()) {
      if (!mostSoldProduct || quantitySold > mostSoldProduct.quantitySold) {
        mostSoldProduct = { productId, name, quantitySold };
      }
    }

    // Artesano que más vendió
    let topArtisan: {
      artisanId: number;
      name: string;
      totalSold: number;
    } | null = null;
    for (const [artisanId, { name, totalSold }] of artisanSalesMap.entries()) {
      if (!topArtisan || totalSold > topArtisan.totalSold) {
        topArtisan = { artisanId, name, totalSold };
      }
    }

    // Comisiones
    const associationCommission =
      totalSales * (event.commissionAssociation / 100);
    const sellerCommission = totalSales * (event.commissionSeller / 100);
    const netForArtisans =
      totalSales - associationCommission - sellerCommission;

    return {
      eventId: event.id,
      eventName: event.name,
      totalSales,
      paymentTotals,
      associationCommission,
      sellerCommission,
      netForArtisans,
      mostSoldProduct,
      topArtisan,
      cardFeesTotal,
    };
  }

  // Cierra un evento (cambia estado a CLOSED)
  async closeEvent(id: number) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('El evento no existe');

    const status = getEventStatus(event);

    // Solo permite cerrar si está ACTIVE o si ya pasó la fecha de fin (CLOSED por fecha)
    // No permite cerrar si aún no ha iniciado (SCHEDULED) o si ya fue cerrado manualmente
    if (status === 'SCHEDULED') {
      throw new BadRequestException(
        'No puedes cerrar un evento que aún no ha iniciado.',
      );
    }

    if (event.state === 'CLOSED') {
      throw new BadRequestException('El evento ya está cerrado.');
    }

    // Si el evento ya pasó la fecha de fin, mantener la fecha original de fin
    // Si está activo, establecer la fecha actual como fecha de fin
    const updateData = {
      state: 'CLOSED' as const,
      ...(status === 'ACTIVE' ? { endDate: new Date() } : {}),
    };

    return this.prisma.event.update({
      where: { id },
      data: updateData,
    });
  }

  async getEventAccountingSummary(
    eventId: number,
  ): Promise<EventAccountingSummaryDto> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    // 1. Ventas activas
    const sales = await this.prisma.sale.findMany({
      where: { eventId, state: 'ACTIVE' },
      include: { artisan: true, product: true },
      orderBy: { date: 'asc' },
    });

    // 2. Cambios en el evento
    const productChanges = await this.prisma.productChange.findMany({
      where: { sale: { eventId } },
      include: {
        deliveredProduct: true,
        returnedProduct: true,
        sale: { include: { artisan: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log('sales:', sales);
    console.log('productChanges:', productChanges);

    // 3. Agrupa por artesano
    const artisanMap = new Map<
      number,
      {
        artisanName: string;
        artisanIdentification: string;
        sales: EventArtisanSaleDetailDto[];
      }
    >();

    // Ventas activas
    for (const sale of sales) {
      if (!sale.artisan || !sale.product) continue;
      if (!artisanMap.has(sale.artisanId)) {
        artisanMap.set(sale.artisanId, {
          artisanName: sale.artisan.name,
          artisanIdentification: sale.artisan.identification, // <-- Asegúrate de incluir esto
          sales: [],
        });
      }
      artisanMap.get(sale.artisanId)!.sales.push({
        saleId: sale.id,
        date: sale.date,
        productId: sale.productId,
        productName: sale.product.name,
        quantitySold: sale.quantitySold,
        unitPrice: sale.valueCharged / sale.quantitySold,
        valueCharged: sale.valueCharged,
        paymentMethod: sale.paymentMethod,
        cardFee: sale.cardFee ?? 0,
        type: 'VENTA',
      });
    }

    // Cambios
    for (const change of productChanges) {
      if (!change.sale || !change.sale.artisan || !change.deliveredProduct)
        continue;
      const artisanId = change.sale.artisanId;
      if (!artisanMap.has(artisanId)) {
        artisanMap.set(artisanId, {
          artisanName: change.sale.artisan.name,
          artisanIdentification: change.sale.artisan.identification, // <-- Igual aquí
          sales: [],
        });
      }
      artisanMap.get(artisanId)!.sales.push({
        saleId: change.saleId,
        date: change.createdAt,
        productId: change.productDeliveredId,
        productName: change.deliveredProduct.name,
        quantitySold: change.quantity,
        unitPrice: change.deliveredProductPrice,
        valueCharged: change.deliveredProductPrice * change.quantity,
        paymentMethod:
          change.paymentMethodDifference === 'CASH' ||
          change.paymentMethodDifference === 'CARD'
            ? (change.paymentMethodDifference as 'CASH' | 'CARD')
            : undefined,
        cardFee: change.cardFeeDifference ?? 0,
        type: 'CAMBIO',
        valueDifference: change.valueDifference ?? 0,
      });
    }

    // 4. Calcula totales por artesano y globales
    const artisans: EventArtisanAccountingSummaryDto[] = [];
    let totalSold = 0,
      totalCardFees = 0,
      totalCommissionAssociation = 0,
      totalCommissionSeller = 0,
      totalNetReceived = 0;

    for (const [
      artisanId,
      { artisanName, artisanIdentification, sales },
    ] of artisanMap.entries()) {
      // Totales por artesano
      const artisanTotalSold = sales.reduce(
        (sum, s) => sum + s.valueCharged,
        0,
      );
      const artisanTotalCardFees = sales.reduce(
        (sum, s) => sum + (s.cardFee ?? 0),
        0,
      );
      const commissionAssociation =
        artisanTotalSold * (event.commissionAssociation / 100);
      const commissionSeller =
        artisanTotalSold * (event.commissionSeller / 100);
      const netReceived =
        artisanTotalSold -
        commissionAssociation -
        commissionSeller -
        artisanTotalCardFees;

      artisans.push({
        artisanId,
        artisanName,
        artisanIdentification, // <-- Aquí también
        sales,
        totalSold: artisanTotalSold,
        totalCardFees: artisanTotalCardFees,
        commissionAssociation,
        commissionSeller,
        netReceived,
      });

      totalSold += artisanTotalSold;
      totalCardFees += artisanTotalCardFees;
      totalCommissionAssociation += commissionAssociation;
      totalCommissionSeller += commissionSeller;
      totalNetReceived += netReceived;
    }

    return {
      eventId: event.id,
      eventName: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      commissionAssociationPercent: event.commissionAssociation,
      commissionSellerPercent: event.commissionSeller,
      artisans,
      totalSold,
      totalCardFees,
      totalCommissionAssociation,
      totalCommissionSeller,
      totalNetReceived,
    };
  }
}
