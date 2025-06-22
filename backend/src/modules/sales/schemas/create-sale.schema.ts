import { z } from 'zod';

/**
 * Schema de Zod para crear una venta individual.
 * Define las reglas de validación para los datos de entrada.
 */
export const CreateSaleSchema = z.object({
  eventId: z
    .number()
    .int('El ID del evento debe ser un número entero')
    .positive('El ID del evento debe ser positivo'),

  productId: z
    .number()
    .int('El ID del producto debe ser un número entero')
    .positive('El ID del producto debe ser positivo'),

  artisanId: z
    .number()
    .int('El ID del artesano debe ser un número entero')
    .positive('El ID del artesano debe ser positivo'),

  quantitySold: z
    .number()
    .int('La cantidad vendida debe ser un número entero')
    .positive('La cantidad vendida debe ser mayor a cero'),

  valueCharged: z
    .number()
    .positive('El valor cobrado debe ser mayor a cero'),

  paymentMethod: z
    .enum(['CASH', 'CARD'], {
      errorMap: () => ({ message: 'El método de pago debe ser CASH o CARD' }),
    }),

  cardFee: z
    .number()
    .min(0, 'El fee de tarjeta no puede ser negativo')
    .optional(),
});

export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;
