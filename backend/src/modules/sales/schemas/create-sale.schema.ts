import { z } from 'zod';

export const CreateSaleSchema = z.object({
  eventId: z.number().int().positive("Event ID must be positive"),
  productId: z.number().int().positive("Product ID must be positive"),
  artisanId: z.number().int().positive("Artisan ID must be positive"),
  quantitySold: z.number().int().positive("Quantity sold must be positive"),
  valueCharged: z.number().positive("El valor cobrado debe ser positivo"),
  paymentMethod: z.enum(['CASH', 'CARD']),
  cardFee: z.number().nonnegative().optional(),
});