import { z } from 'zod';

export const UpdateArtisanSchema = z.object({
  name: z.string().min(1).optional(),
  identification: z.string().min(1).optional(),
  active: z.boolean().optional(),
});
