import { z } from 'zod';

/**
 * Schema de validación Zod para crear productos.
 * Define las reglas de validación para los datos de entrada.
 */
export const CreateProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  price: z.number().positive('El precio debe ser positivo'),
  eventId: z
    .number()
    .int()
    .positive('El ID del evento debe ser un número positivo'),
  artisanId: z
    .number()
    .int()
    .positive('El ID del artesano debe ser un número positivo'),
  initialQuantity: z
    .number()
    .int()
    .nonnegative('La cantidad inicial debe ser cero o positiva'),
  category: z.string().optional(),
});
