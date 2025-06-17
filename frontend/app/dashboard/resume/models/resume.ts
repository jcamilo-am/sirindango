import { z } from 'zod';

export const ResumeEventSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: z.string(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  totalRevenue: z.number(),
  totalProducts: z.number(),
  uniqueArtisans: z.number(),
  salesCount: z.number(),
});

export const ResumeArtisanSchema = z.object({
  artisanId: z.number(),
  name: z.string(),
  totalRevenue: z.number(),
  totalProducts: z.number(),
  sales: z.array(z.any()), // puedes refinar esto si tienes el modelo de venta
});

export type ResumeEvent = z.infer<typeof ResumeEventSchema>;
export type ResumeArtisan = z.infer<typeof ResumeArtisanSchema>; 