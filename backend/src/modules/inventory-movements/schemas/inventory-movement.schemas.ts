import { z } from 'zod';

// Schema base para movimientos de inventario
export const CreateInventoryMovementSchema = z.object({
  type: z.enum(['ENTRADA', 'SALIDA'], {
    errorMap: () => ({ message: 'Tipo debe ser ENTRADA o SALIDA' })
  }),
  quantity: z.number().int().positive({ 
    message: 'La cantidad debe ser un número entero positivo' 
  }),
  reason: z.string().min(1, { message: 'La razón es requerida' }).max(255, {
    message: 'La razón no puede exceder 255 caracteres'
  }).optional(),
  productId: z.number().int().positive({ 
    message: 'ID del producto debe ser un número positivo' 
  }),
  saleId: z.number().int().positive({ 
    message: 'ID de venta debe ser un número positivo' 
  }).optional(),
  changeId: z.number().int().positive({ 
    message: 'ID de cambio debe ser un número positivo' 
  }).optional(),
}).refine((data) => {
  // No puede tener tanto saleId como changeId al mismo tiempo
  if (data.saleId && data.changeId) {
    return false;
  }
  return true;
}, {
  message: 'Un movimiento no puede estar asociado tanto a una venta como a un cambio',
  path: ['saleId', 'changeId']
});

// Schema para búsqueda de movimientos por ID
export const GetInventoryMovementParamsSchema = z.object({
  id: z.number().int().positive({ message: 'ID debe ser un número positivo' }),
});

// Schema para filtros de búsqueda
export const InventoryMovementFiltersSchema = z.object({
  productId: z.number().int().positive().optional(),
  type: z.enum(['ENTRADA', 'SALIDA']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  eventId: z.number().int().positive().optional(),
  artisanId: z.number().int().positive().optional(),
  saleId: z.number().int().positive().optional(),
  changeId: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
}).refine((data) => {
  // Si hay startDate, debe ser anterior a endDate
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'La fecha de inicio debe ser anterior a la fecha de fin',
  path: ['startDate', 'endDate']
});

// Schema para estadísticas de movimientos
export const InventoryMovementStatsParamsSchema = z.object({
  productId: z.number().int().positive().optional(),
  eventId: z.number().int().positive().optional(),
  artisanId: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
