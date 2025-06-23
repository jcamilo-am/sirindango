import { z } from 'zod';
import { MovementType } from '@/lib/types';

// Schema para crear movimiento de inventario
export const CreateInventoryMovementSchema = z.object({
  type: z.nativeEnum(MovementType),
  quantity: z.number().int().positive("La cantidad debe ser un número positivo"),
  reason: z.string().optional(),
  productId: z.number().int().positive("Debe seleccionar un producto válido"),
  saleId: z.number().int().positive().optional(),
  changeId: z.number().int().positive().optional(),
});

// Schema para movimiento de inventario completo
export const InventoryMovementSchema = z.object({
  id: z.number(),
  type: z.nativeEnum(MovementType),
  quantity: z.number(),
  reason: z.string().nullable(),
  createdAt: z.string().transform((str) => new Date(str)),
  productId: z.number(),
  saleId: z.number().nullable(),
  changeId: z.number().nullable(),
  product: z.object({
    id: z.number(),
    name: z.string(),
    price: z.number().optional(),
    category: z.string().nullable(),
    artisan: z.object({
      id: z.number(),
      name: z.string(),
    }).nullable(),
    event: z.object({
      id: z.number(),
      name: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.string().optional(),
    }).nullable(),
  }).nullable(),
});

// Tipos inferidos
export type CreateInventoryMovement = z.infer<typeof CreateInventoryMovementSchema>;
export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;

// Filtros para búsqueda
export interface InventoryMovementFilters {
  productId?: number;
  type?: MovementType;
  startDate?: string;
  endDate?: string;
} 