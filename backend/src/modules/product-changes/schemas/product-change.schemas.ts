import { z } from 'zod';

// Base schema for product change operations
export const CreateProductChangeSchema = z.object({
  saleId: z.number().int().positive({ message: 'ID de venta debe ser un número positivo' }),
  productReturnedId: z.number().int().positive({ message: 'ID del producto devuelto debe ser un número positivo' }),
  productDeliveredId: z.number().int().positive({ message: 'ID del producto entregado debe ser un número positivo' }),
  quantity: z.number().int().positive({ message: 'La cantidad debe ser un número positivo' }),
  paymentMethodDifference: z.enum(['CASH', 'CARD'], {
    errorMap: () => ({ message: 'Método de pago debe ser CASH o CARD' })
  }).optional(),
  cardFeeDifference: z.number().nonnegative({ message: 'El fee de tarjeta debe ser un número no negativo' }).optional(),
}).refine((data) => {
  // Si el método de pago es CARD, debe incluir cardFeeDifference
  if (data.paymentMethodDifference === 'CARD' && data.cardFeeDifference === undefined) {
    return false;
  }
  // Si hay cardFeeDifference, debe ser CARD
  if (data.cardFeeDifference !== undefined && data.paymentMethodDifference !== 'CARD') {
    return false;
  }
  return true;
}, {
  message: 'Si el método de pago es CARD, debe incluir el fee de tarjeta',
  path: ['cardFeeDifference']
});

// Schema for querying product changes
export const GetProductChangeParamsSchema = z.object({
  id: z.number().int().positive({ message: 'ID debe ser un número positivo' }),
});

// Schema for listing product changes with filters
export const ListProductChangesQuerySchema = z.object({
  eventId: z.number().int().positive().optional(),
  artisanId: z.number().int().positive().optional(),
  saleId: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});
