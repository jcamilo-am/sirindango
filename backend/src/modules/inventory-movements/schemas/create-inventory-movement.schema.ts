import { z } from 'zod';

export const CreateInventoryMovementSchema = z.object({
  type: z.enum(['ENTRADA', 'SALIDA']),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
  productId: z.number().int().positive(),
  saleId: z.number().int().positive().optional(),
  changeId: z.number().int().positive().optional(),
});