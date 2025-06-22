import { z } from 'zod';

/**
 * Schema de Zod para actualizar una venta.
 * Solo permite actualizar ciertos campos de la venta.
 */
export const UpdateSaleSchema = z.object({
  quantitySold: z
    .number()
    .int('La cantidad vendida debe ser un número entero')
    .positive('La cantidad vendida debe ser mayor a cero')
    .optional(),

  valueCharged: z
    .number()
    .positive('El valor cobrado debe ser mayor a cero')
    .optional(),

  paymentMethod: z
    .enum(['CASH', 'CARD'], {
      errorMap: () => ({ message: 'El método de pago debe ser CASH o CARD' }),
    })
    .optional(),

  cardFee: z
    .number()
    .min(0, 'El fee de tarjeta no puede ser negativo')
    .optional(),

  state: z
    .enum(['ACTIVE', 'CANCELLED'], {
      errorMap: () => ({ message: 'El estado debe ser ACTIVE o CANCELLED' }),
    })
    .optional(),

  type: z
    .enum(['VENTA', 'CAMBIO'], {
      errorMap: () => ({ message: 'El tipo debe ser VENTA o CAMBIO' }),
    })
    .optional(),

  valueDifference: z
    .number()
    .min(0, 'La diferencia de valor no puede ser negativa')
    .optional(),
}).partial();

export type UpdateSaleInput = z.infer<typeof UpdateSaleSchema>;
