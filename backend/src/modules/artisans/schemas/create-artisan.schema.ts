import { z } from 'zod';

export const CreateArtisanSchema = z.object({
  name: z.string().min(1),
  identification: z.string().min(1),
  active: z.boolean().optional()
});

export const UpdateArtisanSchema = z.object({
  name: z.string().min(1).optional(),
});