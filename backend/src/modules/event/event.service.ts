import { Injectable } from '@nestjs/common';
import { CreateEventType } from './types/create-event.type';
import { UpdateEventType } from './types/update-event.type';
import { PrismaService } from 'src/modules/prisma/prisma.service';

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
}