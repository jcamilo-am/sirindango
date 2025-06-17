import { z } from 'zod';

export const SaleSchema = z.object({
  id: z.number(),
  productId: z.number(),
  artisanId: z.number(),
  eventId: z.number(),
  quantitySold: z.number(),
  totalAmount: z.number(),
  date: z.string().or(z.date()),
});

export const SaleListSchema = z.array(SaleSchema);
export const CreateSaleSchema = SaleSchema.omit({ id: true });

export type Sale = z.infer<typeof SaleSchema>;
export type CreateSale = z.infer<typeof CreateSaleSchema>; 