import { z } from 'zod';

export const UpdateSaleSchema = z.object({
  eventId: z.number().int().positive("Event ID must be positive").optional(),
  productId: z.number().int().positive("Product ID must be positive").optional(),
  artisanId: z.number().int().positive("Artisan ID must be positive").optional(),
  quantitySold: z.number().int().positive("Quantity sold must be positive").optional(),
});