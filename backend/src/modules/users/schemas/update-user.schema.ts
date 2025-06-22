import { z } from 'zod';

/**
 * Schema de Zod para actualizar un usuario.
 * Define las reglas de validación para los datos de entrada.
 */
export const UpdateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede tener más de 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos')
    .optional(),
  
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede tener más de 100 caracteres')
    .optional(),
  
  role: z
    .string()
    .min(1, 'El rol no puede estar vacío')
    .max(50, 'El rol no puede tener más de 50 caracteres')
    .optional(),
}).partial();

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
