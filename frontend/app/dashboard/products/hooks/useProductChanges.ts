import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { 
  ProductChange,
  CreateProductChange,
  CreateProductChangeSchema
} from '../models/product';

export function useProductChanges() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CREATE - Crear cambio de producto
  const createProductChange = async (change: CreateProductChange) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateProductChangeSchema.parse(change);
      const res = await apiClient.post('/product-changes', parsed);
      return res.data as ProductChange;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear cambio de producto';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // GET - Obtener cambio de producto por ID
  const fetchProductChangeById = async (id: number): Promise<ProductChange | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/product-changes/${id}`);
      return res.data as ProductChange;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar cambio de producto';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createProductChange,
    fetchProductChangeById,
  };
} 