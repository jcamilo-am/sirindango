import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { 
  ArtisanSchema,
  ArtisanListSchema, 
  Artisan, 
  CreateArtisanSchema, 
  CreateArtisan, 
  UpdateArtisan,
  ArtisanSummary,
  ArtisanSummaryContable,
  getActiveArtisans,
  searchArtisans
} from '../models/artisan';

export function useArtisans() {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función auxiliar para manejar errores
  const handleError = (err: unknown, defaultMessage: string): string => {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const axiosError = err as { response?: { data?: { message?: string; statusCode?: number } } };
      const message = axiosError.response?.data?.message;
      const statusCode = axiosError.response?.data?.statusCode;
      
      // Detectar error de identificación duplicada (puede venir como 400 o 409)
      if ((statusCode === 400 || statusCode === 409) && message && message.includes('identificación')) {
        return message; // Devolver el mensaje exacto del backend
      }
      
      return message || defaultMessage;
    }
    return defaultMessage;
  };

  // GET - Obtener todos los artesanos
  const fetchArtisans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/artisans');
      const data = ArtisanListSchema.parse(res.data);
      setArtisans(data);
      return data;
    } catch (err: unknown) {
      const message = handleError(err, 'Error al cargar artesanos');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // GET - Obtener artesano por ID
  const fetchArtisanById = useCallback(async (id: number): Promise<Artisan> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/artisans/${id}`);
      const data = ArtisanSchema.parse(res.data);
      return data;
    } catch (err: unknown) {
      const message = handleError(err, 'Error al cargar artesano');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // CREATE - Crear nuevo artesano
  const createArtisan = useCallback(async (artisan: CreateArtisan): Promise<Artisan> => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateArtisanSchema.parse(artisan);
      const res = await apiClient.post('/artisans', parsed);
      const newArtisan = ArtisanSchema.parse(res.data);
      setArtisans((prev) => [...prev, newArtisan]);
      return newArtisan;
    } catch (err: unknown) {
      const message = handleError(err, 'Error al crear artesano');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // EDIT - Actualizar artesano
  const editArtisan = useCallback(async (id: number, artisan: UpdateArtisan): Promise<Artisan> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.patch(`/artisans/${id}`, artisan);
      const updatedArtisan = ArtisanSchema.parse(res.data);
      setArtisans((prev) => prev.map((a) => (a.id === id ? updatedArtisan : a)));
      return updatedArtisan;
    } catch (err: unknown) {
      const message = handleError(err, 'Error al actualizar artesano');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE - Eliminar artesano
  const deleteArtisan = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/artisans/${id}`);
      setArtisans((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (err: unknown) {
      const message = handleError(err, 'Error al eliminar artesano');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // GET - Resumen de artesano por evento
  const getArtisanSummary = useCallback(async (artisanId: number, eventId: number): Promise<ArtisanSummary> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/artisans/${artisanId}/summary?eventId=${eventId}`);
      return res.data as ArtisanSummary;
    } catch (err: unknown) {
      const message = handleError(err, 'Error al obtener resumen del artesano');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // GET - Resumen contable detallado de artesano por evento
  const getArtisanContableSummary = useCallback(async (artisanId: number, eventId: number): Promise<ArtisanSummaryContable> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/artisans/${artisanId}/contable-summary?eventId=${eventId}`);
      return res.data as ArtisanSummaryContable;
    } catch (err: unknown) {
      const message = handleError(err, 'Error al obtener resumen contable del artesano');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Funciones auxiliares que usan las utilidades del modelo
  const getActiveArtisansData = useCallback(() => {
    return getActiveArtisans(artisans);
  }, [artisans]);

  const searchArtisansByName = useCallback((name: string) => {
    return searchArtisans(artisans, name);
  }, [artisans]);

  // Función para validar si un artesano existe y está activo
  const validateArtisan = useCallback((artisanId: number): boolean => {
    const artisan = artisans.find(a => a.id === artisanId);
    return artisan ? artisan.active : false;
  }, [artisans]);

  // Función para obtener el nombre del artesano por ID
  const getArtisanName = useCallback((artisanId: number): string => {
    const artisan = artisans.find(a => a.id === artisanId);
    return artisan?.name || 'Artesano no encontrado';
  }, [artisans]);

  return {
    // Estado
    artisans,
    loading,
    error,
    // Acciones básicas CRUD
    setArtisans,
    fetchArtisans,
    fetchArtisanById,
    createArtisan,
    editArtisan,
    deleteArtisan,
    // Funciones de resumen
    getArtisanSummary,
    getArtisanContableSummary,
    // Funciones auxiliares
    getActiveArtisans: getActiveArtisansData,
    searchArtisansByName,
    validateArtisan,
    getArtisanName,
  };
} 