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
  price: z.number().nonnegative("El precio debe ser cero o positivo"),
  eventId: z.number().int().positive("El ID del evento es obligatorio"),
  artisanId: z.number().int().positive("El ID del artesano es obligatorio"),
  initialQuantity: z.number().int().positive("La cantidad inicial debe ser positiva"),
  category: z.string().min(1, "La categoría es obligatoria"),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").optional(),
  price: z.number().nonnegative("El precio debe ser cero o positivo").optional(),
  eventId: z.number().int().positive("El ID del evento es obligatorio").optional(),
  artisanId: z.number().int().positive("El ID del artesano es obligatorio").optional(),
  category: z.string().min(1, "La categoría es obligatoria").optional(),
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

// Tipos para cambios de productos (product-changes)
export const ProductChangeSchema = z.object({
  id: z.number(),
  saleId: z.number(),
  productReturnedId: z.number(),
  productDeliveredId: z.number(),
  quantity: z.number(),
  deliveredProductPrice: z.number(),
  valueDifference: z.number(),
  paymentMethodDifference: z.string().optional().nullable(),
  cardFeeDifference: z.number().optional().nullable(),
  createdAt: z.string(),
});

export const CreateProductChangeSchema = z.object({
  saleId: z.number().int().positive("El ID de venta es obligatorio"),
  productReturnedId: z.number().int().positive("El ID del producto devuelto es obligatorio"),
  productDeliveredId: z.number().int().positive("El ID del producto entregado es obligatorio"),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  paymentMethodDifference: z.enum(['CASH', 'CARD']).optional(),
  cardFeeDifference: z.number().nonnegative("El fee de tarjeta debe ser cero o positivo").optional(),
});

export type ProductChange = z.infer<typeof ProductChangeSchema>;
export type CreateProductChange = z.infer<typeof CreateProductChangeSchema>;

// Tipos para movimientos de inventario (inventory-movements)
export const InventoryMovementSchema = z.object({
  id: z.number(),
  type: z.enum(['ENTRADA', 'SALIDA']),
  quantity: z.number(),
  reason: z.string().optional().nullable(),
  productId: z.number(),
  saleId: z.number().optional().nullable(),
  changeId: z.number().optional().nullable(),
  createdAt: z.string(),
  // Relaciones expandidas
  product: z.object({
    id: z.number(),
    name: z.string(),
  }).optional(),
  sale: z.object({
    id: z.number(),
    valueCharged: z.number(),
  }).optional(),
  change: z.object({
    id: z.number(),
    valueDifference: z.number(),
  }).optional(),
});

export const InventoryMovementListSchema = z.array(InventoryMovementSchema);

export const CreateInventoryMovementSchema = z.object({
  type: z.enum(['ENTRADA', 'SALIDA'], {
    required_error: "El tipo de movimiento es obligatorio",
    invalid_type_error: "El tipo debe ser ENTRADA o SALIDA"
  }),
  quantity: z.number().int().positive("La cantidad debe ser un número positivo"),
  reason: z.string().min(1, "La razón es obligatoria"),
  productId: z.number().int().positive("El ID del producto es obligatorio"),
  saleId: z.number().int().positive().optional(),
  changeId: z.number().int().positive().optional(),
});

export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;
export type CreateInventoryMovement = z.infer<typeof CreateInventoryMovementSchema>;

// Tipos para filtros de movimientos
export interface InventoryMovementFilters {
  productId?: number;
  type?: 'ENTRADA' | 'SALIDA';
  startDate?: string;
  endDate?: string;
} 