import { z } from 'zod';

export const CreateEventSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .trim(),

    location: z
      .string()
      .min(1, 'La ubicación es requerida')
      .max(200, 'La ubicación no puede exceder 200 caracteres')
      .trim(),

    startDate: z.coerce.date({
      invalid_type_error: 'Fecha de inicio inválida',
      required_error: 'La fecha de inicio es requerida',
    }),

    endDate: z.coerce.date({
      invalid_type_error: 'Fecha de fin inválida',
      required_error: 'La fecha de fin es requerida',
    }),

    commissionAssociation: z
      .number()
      .min(0, 'La comisión de la asociación debe ser mayor o igual a 0')
      .max(100, 'La comisión de la asociación no puede exceder 100%')
      .default(10),

    commissionSeller: z
      .number()
      .min(0, 'La comisión del vendedor debe ser mayor o igual a 0')
      .max(100, 'La comisión del vendedor no puede exceder 100%')
      .default(5),
  })
  .refine((data) => data.startDate < data.endDate, {
    message: 'La fecha de inicio debe ser anterior a la fecha de fin',
    path: ['endDate'],
  });
