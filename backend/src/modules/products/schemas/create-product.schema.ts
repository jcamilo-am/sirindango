import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().positive("Price must be positive"),
  availableQuantity: z.number().int().nonnegative("Quantity must be zero or positive"),
  eventId: z.number().int().positive("Event ID must be positive"),
  artisanId: z.number().int().positive("Artisan ID must be positive"),
  category: z.string().optional(),
});