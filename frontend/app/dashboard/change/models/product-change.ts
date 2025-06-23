import { z } from 'zod';

// Schema principal de ProductChange (coincide con Prisma)
export const ProductChangeSchema = z.object({
  id: z.number(),
  saleId: z.number(),
  productReturnedId: z.number(),
  productDeliveredId: z.number(),
  quantity: z.number(),
  deliveredProductPrice: z.number(),
  valueDifference: z.number(),
  paymentMethodDifference: z.string().optional().nullable(),
  cardFeeDifference: z.number().optional().nullable(),
  createdAt: z.string(),
  // Relaciones expandidas
  sale: z.object({
    id: z.number(),
    quantitySold: z.number(),
    valueCharged: z.number(),
    paymentMethod: z.enum(['CASH', 'CARD']),
    date: z.string(),
  }).optional(),
  returnedProduct: z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    category: z.string().optional().nullable(),
  }).optional(),
  deliveredProduct: z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    category: z.string().optional().nullable(),
  }).optional(),
});

export const ProductChangeListSchema = z.array(ProductChangeSchema);

// Schema para crear un cambio de producto
export const CreateProductChangeSchema = z.object({
  saleId: z.number().int().positive("El ID de venta es obligatorio"),
  productReturnedId: z.number().int().positive("El ID del producto devuelto es obligatorio"),
  productDeliveredId: z.number().int().positive("El ID del producto entregado es obligatorio"),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  paymentMethodDifference: z.enum(['CASH', 'CARD'], {
    errorMap: () => ({ message: "El método de pago debe ser CASH o CARD" })
  }).optional(),
  cardFeeDifference: z.number()
    .nonnegative("El fee de tarjeta debe ser cero o positivo")
    .optional(),
});

// Tipos TypeScript
export type ProductChange = z.infer<typeof ProductChangeSchema>;
export type CreateProductChange = z.infer<typeof CreateProductChangeSchema>;

// Tipos para filtros
export interface ProductChangeFilters {
  saleId?: number;
  eventId?: number;
  artisanId?: number;
  startDate?: string;
  endDate?: string;
}

// DTO extendido con información calculada para la UI
export interface ProductChangeWithCalculations extends ProductChange {
  originalValue: number;
  newValue: number;
  customerPays: number;
  netGainForArtisan: number;
}

// Función utilitaria para calcular valores
export const calculateChangeValues = (change: ProductChange): ProductChangeWithCalculations => {
  const originalValue = (change.returnedProduct?.price || 0) * change.quantity;
  const newValue = change.deliveredProductPrice * change.quantity;
  const customerPays = change.valueDifference;
  const netGainForArtisan = customerPays - (change.cardFeeDifference || 0);

  return {
    ...change,
    originalValue,
    newValue,
    customerPays,
    netGainForArtisan,
  };
};

// Función para validar si un cambio es posible
export const validateChangeRequest = (
  saleQuantity: number,
  requestedQuantity: number,
  originalPrice: number,
  newPrice: number
): { isValid: boolean; error?: string } => {
  if (requestedQuantity > saleQuantity) {
    return { 
      isValid: false, 
      error: 'No puedes cambiar más unidades de las que se vendieron' 
    };
  }

  if (newPrice < originalPrice) {
    return { 
      isValid: false, 
      error: 'No se permite cambiar por un producto de menor valor' 
    };
  }

  return { isValid: true };
}; 