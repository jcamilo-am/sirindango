import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  category: z.string().optional().nullable(),
  eventId: z.number(),
  artisanId: z.number(),
  stock: z.number().optional().default(0), // Stock calculado del backend
  createdAt: z.string().optional(),
  // Relaciones expandidas (cuando se incluyen en las respuestas)
  event: z.object({
    id: z.number(),
    name: z.string(),
  }).optional(),
  artisan: z.object({
    id: z.number(),
    name: z.string(),
  }).optional(),
});

export const ProductListSchema = z.array(ProductSchema);

export const CreateProductSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  price: z.number().positive("El precio debe ser positivo"),
  eventId: z.number().int().positive("El ID del evento es obligatorio"),
  artisanId: z.number().int().positive("El ID del artesano es obligatorio"),
  initialQuantity: z.number().int().nonnegative("La cantidad inicial debe ser cero o positiva"),
  category: z.string().optional(),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").optional(),
  price: z.number().positive("El precio debe ser positivo").optional(),
  category: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;

// Tipos para filtros de productos
export interface ProductFilters {
  eventId?: number;
  artisanId?: number;
  order?: 'name' | 'quantity';
  category?: string;
}

// DTOs para resúmenes de productos
export const ProductSummarySchema = z.object({
  productId: z.number(),
  productName: z.string(),
  totalSold: z.number(),
  totalRevenue: z.number(),
  currentStock: z.number(),
  category: z.string().optional(),
});

export type ProductSummary = z.infer<typeof ProductSummarySchema>; 