// Enums que coinciden con el backend
export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
}

export enum SaleState {
  ACTIVE = 'ACTIVE',
  CHANGED = 'CHANGED',
  CANCELLED = 'CANCELLED',
}

export enum MovementType {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}

export enum EventState {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

// Tipos de respuesta comunes
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para filtros comunes
export interface BaseFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Tipos de error de API
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: string[];
}

// Tipos para fechas
export interface DateRange {
  startDate: string;
  endDate: string;
}

// Estados de loading
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Tipos para los resúmenes financieros
export interface FinancialSummary {
  totalCash: number;
  totalCard: number;
  totalCardFees: number;
  totalGross: number;
  totalCommissionAssociation: number;
  totalCommissionSeller: number;
  totalNetForArtisans: number;
}

// Tipos para configuración de la aplicación
export interface AppConfig {
  apiUrl: string;
  appName: string;
  version: string;
} 