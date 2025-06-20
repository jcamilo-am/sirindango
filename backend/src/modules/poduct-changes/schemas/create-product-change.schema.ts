import { z } from 'zod';

export const CreateProductChangeSchema = z.object({
  saleId: z.number().int().positive(),
  productReturnedId: z.number().int().positive(),
  productDeliveredId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  paymentMethodDifference: z.enum(['CASH', 'CARD']).optional(),
  cardFeeDifference: z.number().nonnegative().optional(),
});