import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().positive("Price must be positive"),
  eventId: z.number().int().positive("Event ID must be positive"),
  artisanId: z.number().int().positive("Artisan ID must be positive"),
  initialQuantity: z.number().int().nonnegative("Initial quantity must be zero or positive"),
  category: z.string().optional(),
});