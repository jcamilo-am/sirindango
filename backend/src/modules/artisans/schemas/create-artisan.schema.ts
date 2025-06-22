import { z } from 'zod';

/**
 * Schema de validación Zod para crear artesanos.
 * Define las reglas de validación para los datos de entrada.
 */
export const CreateArtisanSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre es muy largo')
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      'El nombre solo puede contener letras y espacios',
    ),
  identification: z
    .string()
    .min(5, 'La identificación debe tener al menos 5 números')
    .max(10, 'La identificación debe tener máximo 10 números')
    .regex(/^\d+$/, 'La identificación solo puede contener números'),
  active: z.boolean().optional().default(true),
});
