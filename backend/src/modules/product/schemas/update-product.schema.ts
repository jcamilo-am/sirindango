import { z } from 'zod';

export const UpdateProductSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  price: z.number().positive("Price must be positive").optional(),
  availableQuantity: z.number().int().nonnegative("Quantity must be zero or positive").optional(),
  eventId: z.number().int().positive("Event ID must be positive").optional(),
  artisanId: z.number().int().positive("Artisan ID must be positive").optional(),
  category: z.string().optional(),
});