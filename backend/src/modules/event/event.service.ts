import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventType } from './types/create-event.type';
import { UpdateEventType } from './types/update-event.type';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { EventSummaryDto, ProductSummaryDto } from './dto/event-summary.dto';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  private addStatus(event: CreateEventType) {
    const now = new Date();
    let status: 'scheduled' | 'active' | 'finished';

    if (now < event.startDate) {
      status = 'scheduled';
    } else if (now > event.endDate) {
      status = 'finished';
    } else {
      status = 'active';
    }

    return { ...event, status };
  }

  create(data: CreateEventType) {
    return this.prisma.event.create({ data }).then(event => this.addStatus(event));
  }

  async findAll() {
    const events = await this.prisma.event.findMany();
    return events.map(event => this.addStatus(event));
  }

  async findOne(id: number) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    return event ? this.addStatus(event) : null;
  }

  async update(id: number, data: UpdateEventType) {
    const event = await this.prisma.event.update({ where: { id }, data });
    return this.addStatus(event);
  }

  async findByName(name: string) {
    const events = await this.prisma.event.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
    });
    return events.map(event => this.addStatus(event));
  }

  async getEventSummary(eventId: number): Promise<EventSummaryDto[]> {
    // 1. Check if event exists
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    // 2. Get all artisans with products in this event
    const artisans = await this.prisma.artisan.findMany({
      where: {
        products: { some: { eventId } }
      }
    });

    // 3. Get all products for this event
    const products = await this.prisma.product.findMany({
      where: { eventId },
      include: { artisan: true }
    });

    // 4. Get all sales for this event
    const sales = await this.prisma.sale.findMany({
      where: { eventId }
    });

    // 5. Build general product summary (total sold per product)
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

    // 6. Build summary per artisan
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