import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { 
  InventoryMovement,
  CreateInventoryMovement,
  CreateInventoryMovementSchema,
  InventoryMovementListSchema,
  InventoryMovementFilters
} from '../models/product';

export function useInventoryMovements() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET - Obtener movimientos con filtros opcionales
  const fetchMovements = async (filters?: InventoryMovementFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      if (filters?.productId) params.append('productId', filters.productId.toString());
      if (filters?.type) params.append('type', filters.type);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const queryString = params.toString();
      const url = queryString ? `/inventory-movements?${queryString}` : '/inventory-movements';
      
      const res = await apiClient.get(url);
      const data = InventoryMovementListSchema.parse(res.data);
      setMovements(data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar movimientos';
      setError(message);
      throw err; // Preservar el error original
    } finally {
      setLoading(false);
    }
  };

  // GET - Obtener movimientos por producto
  const fetchMovementsByProduct = async (productId: number) => {
    return await fetchMovements({ productId });
  };

  // GET - Obtener movimiento por ID
  const fetchMovementById = async (id: number): Promise<InventoryMovement | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/inventory-movements/${id}`);
      return res.data as InventoryMovement;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar movimiento';
      setError(message);
      throw err; // Preservar el error original
    } finally {
      setLoading(false);
    }
  };

  // CREATE - Crear nuevo movimiento de inventario
  const createMovement = async (movement: CreateInventoryMovement) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateInventoryMovementSchema.parse(movement);
      const res = await apiClient.post('/inventory-movements', parsed);
      const newMovement = res.data as InventoryMovement;
      setMovements((prev) => [newMovement, ...prev]);
      return newMovement;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear movimiento';
      setError(message);
      throw err; // Preservar el error original
    } finally {
      setLoading(false);
    }
  };

  // Funciones auxiliares para análisis de movimientos
  const getMovementsByProduct = (productId: number) => {
    return movements.filter(movement => movement.productId === productId);
  };

  const getMovementsByType = (type: 'ENTRADA' | 'SALIDA') => {
    return movements.filter(movement => movement.type === type);
  };

  const getMovementsInDateRange = (startDate: string, endDate: string) => {
    return movements.filter(movement => {
      const movementDate = new Date(movement.createdAt);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return movementDate >= start && movementDate <= end;
    });
  };

  const calculateStockByProduct = (productId: number) => {
    const productMovements = getMovementsByProduct(productId);
    const entradas = productMovements
      .filter(m => m.type === 'ENTRADA')
      .reduce((sum, m) => sum + m.quantity, 0);
    const salidas = productMovements
      .filter(m => m.type === 'SALIDA')
      .reduce((sum, m) => sum + m.quantity, 0);
    return entradas - salidas;
  };

  const getRecentMovements = (limit: number = 10) => {
    return [...movements]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  };

  const getMovementsSummary = () => {
    const totalEntradas = movements
      .filter(m => m.type === 'ENTRADA')
      .reduce((sum, m) => sum + m.quantity, 0);
    const totalSalidas = movements
      .filter(m => m.type === 'SALIDA')
      .reduce((sum, m) => sum + m.quantity, 0);
    
    return {
      totalEntradas,
      totalSalidas,
      stockNeto: totalEntradas - totalSalidas,
      totalMovimientos: movements.length
    };
  };

  return {
    movements,
    loading,
    error,
    setMovements,
    fetchMovements,
    fetchMovementsByProduct,
    fetchMovementById,
    createMovement,
    // Funciones auxiliares
    getMovementsByProduct,
    getMovementsByType,
    getMovementsInDateRange,
    calculateStockByProduct,
    getRecentMovements,
    getMovementsSummary,
  };
} 