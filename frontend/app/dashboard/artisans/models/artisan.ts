import { z } from 'zod';

export const ArtisanSchema = z.object({
  id: z.number(),
  name: z.string(),
  identification: z.string(),
  active: z.boolean(),
  createdAt: z.string().optional(),
});

export const ArtisanListSchema = z.array(ArtisanSchema);

export const CreateArtisanSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  identification: z.string().min(1, "La identificación es obligatoria"),
  active: z.boolean().optional().default(true),
});

export const UpdateArtisanSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").optional(),
});

export type Artisan = z.infer<typeof ArtisanSchema>;
export type CreateArtisan = z.infer<typeof CreateArtisanSchema>;
export type UpdateArtisan = z.infer<typeof UpdateArtisanSchema>;

// DTOs para resúmenes de artesanos
export const ArtisanSummarySchema = z.object({
  artisanId: z.number(),
  artisanName: z.string(),
  totalProducts: z.number(),
  totalSales: z.number(),
  totalRevenue: z.number(),
  totalCommission: z.number(),
  netAmount: z.number(),
});

export type ArtisanSummary = z.infer<typeof ArtisanSummarySchema>;