import { z } from 'zod';

// Enums que coinciden con el backend
export const PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD'
} as const;

export const SaleState = {
  ACTIVE: 'ACTIVE',
  CHANGED: 'CHANGED',
  CANCELLED: 'CANCELLED'
} as const;

// Schema principal de venta (completo)
export const SaleSchema = z.object({
  id: z.number(),
  productId: z.number(),
  artisanId: z.number(),
  eventId: z.number(),
  quantitySold: z.number(),
  valueCharged: z.number(), // Valor cobrado real
  paymentMethod: z.enum(['CASH', 'CARD']),
  state: z.enum(['ACTIVE', 'CHANGED', 'CANCELLED']).default('ACTIVE'),
  cardFee: z.number().nullable().optional(), // Solo para pagos con tarjeta
  date: z.string().or(z.date()),
  createdAt: z.string().or(z.date()).optional(),
  // Campos calculados/virtuales
  totalAmount: z.number().optional(), // Para compatibilidad con código existente
});

// Schema para crear venta individual (simplificado)
export const CreateSaleSchema = z.object({
  productId: z.number().positive('El ID del producto es obligatorio'),
  artisanId: z.number().positive('El ID del artesano es obligatorio'),
  eventId: z.number().positive('El ID del evento es obligatorio'),
  quantitySold: z.number().positive('La cantidad debe ser mayor a cero'),
  valueCharged: z.number().nonnegative('El valor cobrado debe ser cero o positivo'),
  paymentMethod: z.enum(['CASH', 'CARD']),
  cardFee: z.number().nonnegative().optional(), // Solo para pagos con tarjeta
  date: z.string().optional(), // Opcional, el backend puede usar fecha actual
});

// Schema para ventas múltiples (nuevo enfoque del backend)
export const CreateMultiSaleItemSchema = z.object({
  productId: z.number().positive('El ID del producto es obligatorio'),
  artisanId: z.number().positive('El ID del artesano es obligatorio'),
  quantitySold: z.number().positive('La cantidad debe ser mayor a cero'),
});

export const CreateMultiSaleSchema = z.object({
  eventId: z.number().positive('El ID del evento es obligatorio'),
  paymentMethod: z.enum(['CASH', 'CARD']),
  cardFeeTotal: z.number().nonnegative().optional(), // Fee total de datafono
  items: z.array(CreateMultiSaleItemSchema).min(1, 'Debe incluir al menos un producto'),
});

// Tipos inferidos
export type Sale = z.infer<typeof SaleSchema>;
export type CreateSale = z.infer<typeof CreateSaleSchema>;
export type CreateMultiSaleItem = z.infer<typeof CreateMultiSaleItemSchema>;
export type CreateMultiSale = z.infer<typeof CreateMultiSaleSchema>;

// Listas
export const SaleListSchema = z.array(SaleSchema);

// Tipos de enums para TypeScript
export type PaymentMethodType = keyof typeof PaymentMethod;
export type SaleStateType = keyof typeof SaleState; 