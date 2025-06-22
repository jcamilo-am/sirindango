import { z } from 'zod';

export const UpdateEventSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .trim()
      .optional(),

    location: z
      .string()
      .min(1, 'La ubicación es requerida')
      .max(200, 'La ubicación no puede exceder 200 caracteres')
      .trim()
      .optional(),

    startDate: z.coerce
      .date({
        invalid_type_error: 'Fecha de inicio inválida',
      })
      .optional(),

    endDate: z.coerce
      .date({
        invalid_type_error: 'Fecha de fin inválida',
      })
      .optional(),

    commissionAssociation: z
      .number()
      .min(0, 'La comisión de la asociación debe ser mayor o igual a 0')
      .max(100, 'La comisión de la asociación no puede exceder 100%')
      .optional(),

    commissionSeller: z
      .number()
      .min(0, 'La comisión del vendedor debe ser mayor o igual a 0')
      .max(100, 'La comisión del vendedor no puede exceder 100%')
      .optional(),
  })
  .refine(
    (data) => {
      // Si se proporcionan ambas fechas, validar que startDate < endDate
      if (data.startDate && data.endDate) {
        return data.startDate < data.endDate;
      }
      return true;
    },
    {
      message: 'La fecha de inicio debe ser anterior a la fecha de fin',
      path: ['endDate'],
    },
  );
