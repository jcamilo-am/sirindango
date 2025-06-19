import { z } from 'zod';

export const CreateProductChangeSchema = z.object({
  saleId: z.number().int().positive(),
  productReturnedId: z.number().int().positive(),
  productDeliveredId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  deliveredProductPrice: z.number().positive("El precio del producto entregado es obligatorio"),
  valueDifference: z.number().nonnegative(),
  paymentMethodDifference: z.enum(['CASH', 'CARD']).optional(),
  cardFeeDifference: z.number().nonnegative().optional(),
});