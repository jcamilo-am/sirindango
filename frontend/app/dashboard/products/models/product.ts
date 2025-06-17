import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  availableQuantity: z.number(),
  eventId: z.number(),
  artisanId: z.number(),
  category: z.string().optional(),
});

export const ProductListSchema = z.array(ProductSchema);
export const CreateProductSchema = ProductSchema.omit({ id: true });

export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>; 