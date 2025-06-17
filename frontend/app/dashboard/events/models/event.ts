import { z } from 'zod';

export const EventSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  // Agrega más campos si tu backend los retorna
});

export const EventListSchema = z.array(EventSchema);
export const CreateEventSchema = EventSchema.omit({ id: true });

export type Event = z.infer<typeof EventSchema>;
export type CreateEvent = z.infer<typeof CreateEventSchema>;
