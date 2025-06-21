import { z } from 'zod';

export const ArtisanSchema = z.object({
  id: z.number(),
  name: z.string(),
  identification: z.string(),
  active: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ArtisanListSchema = z.array(ArtisanSchema);

export const CreateArtisanSchema = z.object({
  name: z.string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre es muy largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras y espacios"),
  identification: z.string()
    .min(5, "La identificación debe tener al menos 5 números")
    .max(10, "La identificación debe tener máximo 10 números")
    .regex(/^\d+$/, "La identificación solo puede contener números"),
  active: z.boolean().optional().default(true),
});

export const UpdateArtisanSchema = z.object({
  name: z.string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre es muy largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras y espacios")
    .optional(),
  identification: z.string()
    .min(5, "La identificación debe tener al menos 5 números")
    .max(10, "La identificación debe tener máximo 10 números")
    .regex(/^\d+$/, "La identificación solo puede contener números")
    .optional(),
  active: z.boolean().optional(),
});

export type Artisan = z.infer<typeof ArtisanSchema>;
export type CreateArtisan = z.infer<typeof CreateArtisanSchema>;
export type UpdateArtisan = z.infer<typeof UpdateArtisanSchema>;

// DTOs para resúmenes de artesanos (coinciden con backend)
export const ArtisanProductSummarySchema = z.object({
  productId: z.number(),
  name: z.string(),
  price: z.number(),
  stock: z.number(),
  quantitySold: z.number(),
});

export const ArtisanSummarySchema = z.object({
  artisanId: z.number(),
  artisanName: z.string(),
  soldProducts: z.array(ArtisanProductSummarySchema),
  unsoldProducts: z.array(ArtisanProductSummarySchema),
  totalSold: z.number(),
  commission: z.number(),
  changes: z.array(z.object({
    saleId: z.number(),
    productReturnedId: z.number().nullable(),
    productDeliveredId: z.number().nullable(),
    quantity: z.number(),
  })),
});

export const ArtisanSaleDetailSchema = z.object({
  saleId: z.number(),
  productId: z.number(),
  productName: z.string(),
  quantitySold: z.number(),
  unitPrice: z.number(),
  totalAmount: z.number(),
  saleDate: z.string(),
  paymentMethod: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']),
});

export const ArtisanSummaryContableSchema = z.object({
  artisanId: z.number(),
  artisanName: z.string(),
  eventId: z.number(),
  eventName: z.string(),
  totalProducts: z.number(),
  totalSales: z.number(),
  totalRevenue: z.number(),
  commission: z.number(),
  netAmount: z.number(),
  salesDetails: z.array(ArtisanSaleDetailSchema),
});

export type ArtisanProductSummary = z.infer<typeof ArtisanProductSummarySchema>;
export type ArtisanSummary = z.infer<typeof ArtisanSummarySchema>;
export type ArtisanSaleDetail = z.infer<typeof ArtisanSaleDetailSchema>;
export type ArtisanSummaryContable = z.infer<typeof ArtisanSummaryContableSchema>;

// Función de utilidad para filtrar artesanos activos
export const getActiveArtisans = (artisans: Artisan[]) => {
  return artisans.filter(artisan => artisan.active);
};

// Función de utilidad para buscar artesanos
export const searchArtisans = (artisans: Artisan[], searchTerm: string) => {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return artisans;
  
  return artisans.filter(artisan => 
    artisan.name.toLowerCase().includes(term) ||
    artisan.identification.toLowerCase().includes(term)
  );
};