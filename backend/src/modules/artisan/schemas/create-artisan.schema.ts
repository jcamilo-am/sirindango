import { z } from 'zod';

export const CreateArtisanSchema = z.object({
  name: z.string().min(1),
  identification: z.string().min(1),
  active: z.boolean().optional(), // opcional, por defecto true en la base de datos
});

export const UpdateArtisanSchema = z.object({
  name: z.string().min(1).optional(),
});