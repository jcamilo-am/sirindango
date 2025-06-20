import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { 
  ArtisanListSchema, 
  Artisan, 
  CreateArtisanSchema, 
  CreateArtisan, 
  UpdateArtisan,
  ArtisanSummary 
} from '../models/artisan';

export function useArtisans() {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET - Obtener todos los artesanos
  const fetchArtisans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/artisans');
      const data = ArtisanListSchema.parse(res.data);
      setArtisans(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar artesanos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // GET - Obtener artesano por ID
  const fetchArtisanById = async (id: number): Promise<Artisan | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/artisans/${id}`);
      return res.data as Artisan;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar artesano';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // CREATE - Crear nuevo artesano
  const createArtisan = async (artisan: CreateArtisan) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateArtisanSchema.parse(artisan);
      const res = await apiClient.post('/artisans', parsed);
      setArtisans((prev) => [...prev, res.data]);
      return res.data as Artisan;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear artesano';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // EDIT - Actualizar artesano
  const editArtisan = async (id: number, artisan: UpdateArtisan) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.patch(`/artisans/${id}`, artisan);
      setArtisans((prev) => prev.map((a) => (a.id === id ? res.data : a)));
      return res.data as Artisan;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar artesano';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // DELETE - Eliminar artesano
  const deleteArtisan = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/artisans/${id}`);
      setArtisans((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar artesano';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // GET - Resumen de artesano por evento
  const getArtisanSummary = async (artisanId: number, eventId: number): Promise<ArtisanSummary | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/artisans/${artisanId}/summary?eventId=${eventId}`);
      return res.data as ArtisanSummary;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener resumen del artesano';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // GET - Resumen contable detallado de artesano por evento
  const getArtisanContableSummary = async (artisanId: number, eventId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/artisans/${artisanId}/contable-summary?eventId=${eventId}`);
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener resumen contable del artesano';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para obtener artesanos activos
  const getActiveArtisans = () => {
    return artisans.filter(artisan => artisan.active);
  };

  // Función auxiliar para buscar artesanos por nombre
  const searchArtisansByName = (name: string) => {
    return artisans.filter(artisan => 
      artisan.name.toLowerCase().includes(name.toLowerCase())
    );
  };

  // Cargar artesanos automáticamente al montar el hook
  useEffect(() => {
    fetchArtisans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    artisans,
    loading,
    error,
    setArtisans,
    fetchArtisans,
    fetchArtisanById,
    createArtisan,
    editArtisan,
    deleteArtisan,
    getArtisanSummary,
    getArtisanContableSummary,
    getActiveArtisans,
    searchArtisansByName,
  };
} 