import { z } from 'zod';

/**
 * Schema para un item de venta múltiple.
 */
export const CreateMultiSaleItemSchema = z.object({
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
});

/**
 * Schema de Zod para crear múltiples ventas.
 * Define las reglas de validación para ventas múltiples.
 */
export const CreateMultiSaleSchema = z.object({
  eventId: z
    .number()
    .int('El ID del evento debe ser un número entero')
    .positive('El ID del evento debe ser positivo'),

  paymentMethod: z
    .enum(['CASH', 'CARD'], {
      errorMap: () => ({ message: 'El método de pago debe ser CASH o CARD' }),
    }),

  cardFeeTotal: z
    .number()
    .min(0, 'El fee total no puede ser negativo')
    .optional()
    .default(0),

  items: z
    .array(CreateMultiSaleItemSchema)
    .min(1, 'Debes enviar al menos un producto para la venta')
    .max(50, 'No puedes procesar más de 50 productos en una sola venta'),
});

export type CreateMultiSaleInput = z.infer<typeof CreateMultiSaleSchema>;
export type CreateMultiSaleItemInput = z.infer<typeof CreateMultiSaleItemSchema>;
