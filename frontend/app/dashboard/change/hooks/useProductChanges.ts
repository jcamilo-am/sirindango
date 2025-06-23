import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { 
  ProductChangeListSchema, 
  ProductChange, 
  CreateProductChangeSchema, 
  CreateProductChange,
  ProductChangeFilters
} from '../models/product-change';

export function useProductChanges() {
  const [productChanges, setProductChanges] = useState<ProductChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET - Obtener todos los cambios de productos con filtros opcionales
  const fetchProductChanges = async (filters?: ProductChangeFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      if (filters?.saleId) params.append('saleId', filters.saleId.toString());
      if (filters?.eventId) params.append('eventId', filters.eventId.toString());
      if (filters?.artisanId) params.append('artisanId', filters.artisanId.toString());
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const queryString = params.toString();
      const url = queryString ? `/product-changes?${queryString}` : '/product-changes';
      
      const res = await apiClient.get(url);
      const data = ProductChangeListSchema.parse(res.data);
      setProductChanges(data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar cambios de productos';
      setError(message);
      throw err;
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
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // CREATE - Crear nuevo cambio de producto
  const createProductChange = async (productChange: CreateProductChange) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateProductChangeSchema.parse(productChange);
      const res = await apiClient.post('/product-changes', parsed);
      const newChange = res.data.productChange as ProductChange;
      setProductChanges((prev) => [...prev, newChange]);
      return {
        productChange: newChange,
        message: res.data.message
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear cambio de producto';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funciones auxiliares para filtrar cambios
  const getChangesBySale = (saleId: number) => {
    return productChanges.filter(change => change.saleId === saleId);
  };

  const getChangesByProduct = (productId: number) => {
    return productChanges.filter(change => 
      change.productReturnedId === productId || 
      change.productDeliveredId === productId
    );
  };

  const getChangesByDate = (startDate: string, endDate?: string) => {
    return productChanges.filter(change => {
      const changeDate = new Date(change.createdAt);
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      
      return changeDate >= start && changeDate <= end;
    });
  };

  // Cálculos agregados
  const getTotalValueDifference = (filters?: ProductChangeFilters) => {
    let filteredChanges = productChanges;
    
    if (filters?.saleId) {
      filteredChanges = filteredChanges.filter(change => change.saleId === filters.saleId);
    }
    
    return filteredChanges.reduce((total, change) => total + change.valueDifference, 0);
  };

  const getTotalCardFees = (filters?: ProductChangeFilters) => {
    let filteredChanges = productChanges;
    
    if (filters?.saleId) {
      filteredChanges = filteredChanges.filter(change => change.saleId === filters.saleId);
    }
    
    return filteredChanges.reduce((total, change) => 
      total + (change.cardFeeDifference || 0), 0
    );
  };

  const getChangesByPaymentMethod = (paymentMethod: 'CASH' | 'CARD') => {
    return productChanges.filter(change => 
      change.paymentMethodDifference === paymentMethod
    );
  };

  // Función para validar si se puede hacer un cambio
  const validateChangeAvailability = async (saleId: number): Promise<{
    canChange: boolean;
    reason?: string;
  }> => {
    try {
      // Verificar si ya existe un cambio para esta venta
      const existingChange = productChanges.find(change => change.saleId === saleId);
      if (existingChange) {
        return {
          canChange: false,
          reason: 'Ya existe un cambio registrado para esta venta'
        };
      }

      // Aquí se podrían agregar más validaciones
      // Por ejemplo, verificar el estado de la venta, el evento, etc.
      
      return { canChange: true };
    } catch (err) {
      return {
        canChange: false,
        reason: 'Error al validar disponibilidad de cambio'
      };
    }
  };

  // Función para obtener estadísticas de cambios
  const getChangeStatistics = () => {
    const totalChanges = productChanges.length;
    const totalValueDifference = getTotalValueDifference();
    const totalCardFees = getTotalCardFees();
    const cashChanges = getChangesByPaymentMethod('CASH').length;
    const cardChanges = getChangesByPaymentMethod('CARD').length;

    return {
      totalChanges,
      totalValueDifference,
      totalCardFees,
      cashChanges,
      cardChanges,
      averageValueDifference: totalChanges > 0 ? totalValueDifference / totalChanges : 0,
    };
  };

  return {
    productChanges,
    loading,
    error,
    setProductChanges,
    fetchProductChanges,
    fetchProductChangeById,
    createProductChange,
    // Funciones auxiliares
    getChangesBySale,
    getChangesByProduct,
    getChangesByDate,
    getTotalValueDifference,
    getTotalCardFees,
    getChangesByPaymentMethod,
    validateChangeAvailability,
    getChangeStatistics,
  };
} 