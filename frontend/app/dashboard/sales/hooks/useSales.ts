import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { 
  SaleListSchema, 
  Sale, 
  CreateSaleSchema, 
  CreateSale,
  CreateMultiSale,
  CreateMultiSaleSchema
} from '../models/sale';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET - Obtener todas las ventas con filtros opcionales
  const fetchSales = async (filters?: {
    eventId?: number;
    artisanId?: number;
    order?: 'date' | 'quantity';
  }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.eventId) params.append('eventId', filters.eventId.toString());
      if (filters?.artisanId) params.append('artisanId', filters.artisanId.toString());
      if (filters?.order) params.append('order', filters.order);

      const queryString = params.toString();
      const url = queryString ? `/sales?${queryString}` : '/sales';
      
      const res = await apiClient.get(url);
      const data = SaleListSchema.parse(res.data);
      setSales(data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar ventas';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // GET - Obtener venta por ID
  const fetchSaleById = async (id: number): Promise<Sale | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/sales/${id}`);
      return res.data as Sale;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar venta';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // CREATE - Crear venta individual (método legacy)
  const createSale = async (sale: CreateSale) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateSaleSchema.parse(sale);
      const res = await apiClient.post('/sales', parsed);
      const newSale = res.data as Sale;
      setSales((prev) => [...prev, newSale]);
      return newSale;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear venta';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // CREATE - Crear ventas múltiples (método recomendado)
  const createMultiSale = async (multiSale: CreateMultiSale) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateMultiSaleSchema.parse(multiSale);
      const res = await apiClient.post('/sales', parsed);
      
      // El backend retorna un array de resultados
      const results = res.data as Array<{ sale: Sale; totalAmount: number }>;
      const newSales = results.map(result => result.sale);
      
      setSales((prev) => [...prev, ...newSales]);
      return results;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear ventas';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // UPDATE - Editar venta (solo campos específicos)
  const editSale = async (id: number, sale: Partial<CreateSale>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.patch(`/sales/${id}`, sale);
      const updatedSale = res.data as Sale;
      setSales((prev) => prev.map((s) => (s.id === id ? updatedSale : s)));
      return updatedSale;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al editar venta';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // CANCEL - Cancelar venta (cambiar estado a CANCELLED)
  const cancelSale = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.patch(`/sales/${id}/cancel`);
      const cancelledSale = res.data as Sale;
      setSales((prev) => prev.map((s) => (s.id === id ? cancelledSale : s)));
      return cancelledSale;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cancelar venta';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // DELETE - Eliminar venta completamente (usar con precaución)
  const deleteSale = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/sales/${id}`);
      setSales((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar venta';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funciones auxiliares para filtrar ventas
  const getSalesByEvent = (eventId: number) => {
    return sales.filter(sale => sale.eventId === eventId);
  };

  const getSalesByArtisan = (artisanId: number) => {
    return sales.filter(sale => sale.artisanId === artisanId);
  };

  const getSalesByPaymentMethod = (paymentMethod: 'CASH' | 'CARD') => {
    return sales.filter(sale => sale.paymentMethod === paymentMethod);
  };

  const getActiveSales = () => {
    return sales.filter(sale => sale.state === 'ACTIVE');
  };

  const getCancelledSales = () => {
    return sales.filter(sale => sale.state === 'CANCELLED');
  };

  // Cálculos agregados
  const getTotalRevenue = (filters?: { eventId?: number; artisanId?: number }) => {
    let filteredSales = sales.filter(sale => sale.state === 'ACTIVE');
    
    if (filters?.eventId) {
      filteredSales = filteredSales.filter(sale => sale.eventId === filters.eventId);
    }
    if (filters?.artisanId) {
      filteredSales = filteredSales.filter(sale => sale.artisanId === filters.artisanId);
    }
    
    return filteredSales.reduce((total, sale) => total + sale.valueCharged, 0);
  };

  const getTotalCardFees = (filters?: { eventId?: number; artisanId?: number }) => {
    let filteredSales = sales.filter(sale => 
      sale.state === 'ACTIVE' && sale.paymentMethod === 'CARD' && sale.cardFee
    );
    
    if (filters?.eventId) {
      filteredSales = filteredSales.filter(sale => sale.eventId === filters.eventId);
    }
    if (filters?.artisanId) {
      filteredSales = filteredSales.filter(sale => sale.artisanId === filters.artisanId);
    }
    
    return filteredSales.reduce((total, sale) => total + (sale.cardFee || 0), 0);
  };

  return {
    sales,
    loading,
    error,
    setSales,
    // Operaciones CRUD
    fetchSales,
    fetchSaleById,
    createSale, // Método legacy
    createMultiSale, // Método recomendado
    editSale,
    cancelSale,
    deleteSale,
    // Funciones auxiliares
    getSalesByEvent,
    getSalesByArtisan,
    getSalesByPaymentMethod,
    getActiveSales,
    getCancelledSales,
    // Cálculos
    getTotalRevenue,
    getTotalCardFees,
  };
} 