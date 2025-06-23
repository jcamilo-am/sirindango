import { z } from 'zod';
import { EventState } from '@/lib/types';

export const EventSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  commissionAssociation: z.number(),
  commissionSeller: z.number(),
  state: z.nativeEnum(EventState).optional().default(EventState.SCHEDULED),
  status: z.nativeEnum(EventState).optional(),
  createdAt: z.string().optional(),
  // Agrega más campos si tu backend los retorna
});

export const EventListSchema = z.array(EventSchema);

export const CreateEventSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  location: z.string().min(1, "La ubicación es obligatoria"),
  startDate: z.string(),
  endDate: z.string(),
  commissionAssociation: z.number().min(0).max(100),
  commissionSeller: z.number().min(0).max(100),
});

export type Event = z.infer<typeof EventSchema>;
export type CreateEvent = z.infer<typeof CreateEventSchema>;

// DTOs adicionales para el resumen del evento
export const EventSummarySchema = z.object({
  eventId: z.number(),
  eventName: z.string(),
  totalCash: z.number(),
  totalCard: z.number(),
  totalCardFees: z.number(),
  totalGross: z.number(),
  totalCommissionAssociation: z.number(),
  totalCommissionSeller: z.number(),
  totalNetForArtisans: z.number(),
});

export type EventSummary = z.infer<typeof EventSummarySchema>;
