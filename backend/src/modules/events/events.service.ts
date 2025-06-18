import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventType } from './types/create-event.type';
import { UpdateEventType } from './types/update-event.type';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { EventSummaryDto, ProductSummaryDto } from './dto/event-summary.dto';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  // Agrega el estado al evento según la fecha actual
  private addStatus(event: CreateEventType) {
    const now = new Date();
    let status: 'scheduled' | 'active' | 'finished';
    if (now < event.startDate) status = 'scheduled';
    else if (now > event.endDate) status = 'finished';
    else status = 'active';
    return { ...event, status };
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
    return events.map(event => this.addStatus(event));
  }

  // Busca un evento por ID, lanza NotFoundException si no existe
  async findOne(id: number) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('El evento no existe');
    return this.addStatus(event);
  }

  // Actualiza un evento, lanza NotFoundException si no existe
  async update(id: number, data: UpdateEventType) {
    try {
      const event = await this.prisma.event.update({ where: { id }, data });
      return this.addStatus(event);
    } catch (error) {
      // Si el evento no existe, el filtro global lo maneja (P2025)
      throw error;
    }
  }

  // Busca eventos por nombre (insensible a mayúsculas/minúsculas)
  async findByName(name: string) {
    const events = await this.prisma.event.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
    });
    return events.map(event => this.addStatus(event));
  }

  // Devuelve el resumen del evento, lanza NotFoundException si no existe
  async getEventSummary(eventId: number): Promise<EventSummaryDto[]> {
    // Verifica si el evento existe
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('El evento no existe');

    // Obtiene artesanos con productos en el evento
    const artisans = await this.prisma.artisan.findMany({
      where: { products: { some: { eventId } } }
    });

    // Obtiene productos del evento
    const products = await this.prisma.product.findMany({
      where: { eventId },
      include: { artisan: true }
    });

    // Obtiene ventas del evento
    const sales = await this.prisma.sale.findMany({ where: { eventId } });

    // Calcula resumen general de productos vendidos
    const generalProductSummaryMap: Record<number, ProductSummaryDto> = {};
    for (const sale of sales) {
      const product = products.find(p => p.id === sale.productId);
      if (!product) continue;
      if (!generalProductSummaryMap[product.id]) {
        generalProductSummaryMap[product.id] = {
          productId: product.id,
          name: product.name,
          quantitySold: 0
        };
      }
      generalProductSummaryMap[product.id].quantitySold! += sale.quantitySold;
    }

    // Construye resumen por artesano
    const summary: EventSummaryDto[] = artisans.map(artisan => {
      const artisanProducts = products.filter(p => p.artisanId === artisan.id);
      const artisanSales = sales.filter(s => s.artisanId === artisan.id);

      const totalRegisteredProducts = artisanProducts.length;
      const totalSoldProducts = artisanSales.reduce((sum, s) => sum + s.quantitySold, 0);
      const totalRevenue = artisanSales.reduce((sum, s) => {
        const prod = products.find(p => p.id === s.productId);
        return sum + (prod ? prod.price * s.quantitySold : 0);
      }, 0);

      const unsoldProducts: ProductSummaryDto[] = artisanProducts
        .filter(p => p.availableQuantity > 0)
        .map(p => ({
          productId: p.id,
          name: p.name,
          availableQuantity: p.availableQuantity
        }));

      const generalProductSummary: ProductSummaryDto[] = artisanProducts.map(p => ({
        productId: p.id,
        name: p.name,
        quantitySold: generalProductSummaryMap[p.id]?.quantitySold || 0
      }));

      return {
        artisanId: artisan.id,
        artisanName: artisan.name,
        totalRegisteredProducts,
        totalSoldProducts,
        totalRevenue,
        unsoldProducts,
        generalProductSummary
      };
    });

    return summary;
  }
}