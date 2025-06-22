import { z } from 'zod';

/**
 * Schema de validación Zod para actualizar productos.
 * Todos los campos son opcionales para permitir actualizaciones parciales.
 */
export const UpdateProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  price: z.number().positive('El precio debe ser positivo').optional(),
  eventId: z
    .number()
    .int()
    .positive('El ID del evento debe ser un número positivo')
    .optional(),
  artisanId: z
    .number()
    .int()
    .positive('El ID del artesano debe ser un número positivo')
    .optional(),
  category: z.string().optional(),
});
