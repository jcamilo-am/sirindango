/*import { Injectable } from '@nestjs/common';
import { EventType } from './types/create-event.type';
import { UpdateEventType } from './types/update-event.type';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: EventType) {
    return this.prisma.event.create({ data });
  }

  findAll() {
    return this.prisma.event.findMany();
  }

  findOne(id: number) {
    return this.prisma.event.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateEventType) {
    return this.prisma.event.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.event.delete({ where: { id } });
  }
}
*/
