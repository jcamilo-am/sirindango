import { z } from 'zod';

// Esquema para crear un producto
export const CreateProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  price: z.number().positive("El precio debe ser positivo"),
  availableQuantity: z.number().int().nonnegative("La cantidad debe ser cero o positiva"),
  eventId: z.number().int().positive("El ID del evento debe ser positivo"),
  artisanId: z.number().int().positive("El ID de la artesana debe ser positivo"),
  category: z.string().optional(),
});

// Esquema para crear una venta
export const CreateSaleSchema = z.object({
  eventId: z.number().int().positive("El ID del evento debe ser positivo"),
  productId: z.number().int().positive("El ID del producto debe ser positivo"),
  artisanId: z.number().int().positive("El ID de la artesana debe ser positivo"),
  quantitySold: z.number().int().positive("La cantidad vendida debe ser positiva"),
}); 