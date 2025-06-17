import { z } from 'zod';

export const ArtisanSchema = z.object({
  id: z.number(),
  name: z.string(),
  identification: z.string().min(5, 'La identificación es obligatoria'),
  active: z.boolean(),
  createdAt: z.string().or(z.date()), // Puede venir como string del backend
});

export const ArtisanListSchema = z.array(ArtisanSchema);
export const CreateArtisanSchema = ArtisanSchema.omit({ id: true, createdAt: true });

export type Artisan = z.infer<typeof ArtisanSchema>;
export type CreateArtisan = z.infer<typeof CreateArtisanSchema>;