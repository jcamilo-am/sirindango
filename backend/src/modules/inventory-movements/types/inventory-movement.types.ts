import { z } from 'zod';
import {
  CreateInventoryMovementSchema,
  GetInventoryMovementParamsSchema,
  InventoryMovementFiltersSchema,
  InventoryMovementStatsParamsSchema
} from '../schemas/inventory-movement.schemas';

// Tipos principales para operaciones de inventario
export type CreateInventoryMovementInput = z.infer<typeof CreateInventoryMovementSchema>;
export type GetInventoryMovementParams = z.infer<typeof GetInventoryMovementParamsSchema>;
export type InventoryMovementFilters = z.infer<typeof InventoryMovementFiltersSchema>;
export type InventoryMovementStatsParams = z.infer<typeof InventoryMovementStatsParamsSchema>;

// Tipos para validación de negocio
export interface InventoryMovementValidation {
  isValid: boolean;
  errors: string[];
}

// Tipos para cálculos de stock
export interface StockCalculation {
  currentStock: number;
  totalEntradas: number;
  totalSalidas: number;
  lastMovementDate?: Date;
}

// Tipos para estadísticas
export interface InventoryMovementStats {
  totalMovements: number;
  totalEntradas: number;
  totalSalidas: number;
  currentStock: number;
  movementsByType: {
    entrada: {
      count: number;
      totalQuantity: number;
    };
    salida: {
      count: number;
      totalQuantity: number;
    };
  };
  movementsByReason: Array<{
    reason: string;
    count: number;
    totalQuantity: number;
  }>;
  dailyMovements?: Array<{
    date: string;
    entradas: number;
    salidas: number;
    netChange: number;
  }>;
}

// Tipos para reportes de inventario
export interface InventoryReport {
  productId: number;
  productName: string;
  currentStock: number;
  totalEntradas: number;
  totalSalidas: number;
  recentMovements: Array<{
    id: number;
    type: 'ENTRADA' | 'SALIDA';
    quantity: number;
    reason?: string;
    createdAt: Date;
  }>;
}

// Tipos para validaciones específicas
export interface ProductValidationResult {
  exists: boolean;
  eventId?: number;
  eventStatus?: string;
  product?: {
    id: number;
    name: string;
    price: number;
    artisanId: number;
    eventId: number;
  };
}

export interface StockValidationResult {
  hasEnoughStock: boolean;
  currentStock: number;
  requestedQuantity: number;
  shortfall?: number;
}
