import { useState } from 'react';
import axios from 'axios';
import { SaleListSchema, Sale, CreateSaleSchema, CreateSale } from '../models/sale';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET
  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/sales`);
      const data = SaleListSchema.parse(res.data);
      setSales(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  // CREATE
  const createSale = async (sale: CreateSale) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateSaleSchema.parse(sale);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/sales`, parsed);
      setSales((prev) => [...prev, res.data]);
      return res.data as Sale;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear venta');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // EDIT
  const editSale = async (id: number, sale: Partial<CreateSale>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${id}`, sale);
      setSales((prev) => prev.map((s) => (s.id === id ? res.data : s)));
      return res.data as Sale;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al editar venta');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const deleteSale = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/sales/${id}`);
      setSales((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar venta');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sales,
    loading,
    error,
    setSales,
    fetchSales,
    createSale,
    editSale,
    deleteSale,
  };
} 