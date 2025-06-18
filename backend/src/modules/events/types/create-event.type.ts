import { z } from 'zod';
import { CreateEventSchema } from '../schemas/create-event.schema';

export type CreateEventType = z.infer<typeof CreateEventSchema>;
