import { createZodDto } from 'nestjs-zod';
import { CreateEventSchema } from '../schemas/create-event.schema';

export class CreateEventDto extends createZodDto(CreateEventSchema) {}
