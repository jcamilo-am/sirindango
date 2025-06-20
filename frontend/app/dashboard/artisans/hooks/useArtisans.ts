import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { ArtisanListSchema, Artisan, CreateArtisanSchema, CreateArtisan } from '../models/artisan';

export function useArtisans() {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET
  const fetchArtisans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/artisans');
      const data = ArtisanListSchema.parse(res.data);
      setArtisans(data);
    }catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar artesanas');
    } finally {
      setLoading(false);
    }
  };

  // CREATE
  const createArtisan = async (artisan: CreateArtisan) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateArtisanSchema.parse(artisan);
      const res = await apiClient.post('/artisans', parsed);
      setArtisans((prev) => [...prev, res.data]);
      return res.data as Artisan;
    } catch (err: unknown) {
  setError(err instanceof Error ? err.message : 'Error al crear artesano');

      return null;
    } finally {
      setLoading(false);
    }
  };

  // EDIT
  const editArtisan = async (id: number, artisan: Partial<CreateArtisan>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.patch(`/artisans/${id}`, artisan);
      setArtisans((prev) => prev.map((a) => (a.id === id ? res.data : a)));
      return res.data as Artisan;
    }catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al editar artesano');
    
      return null;
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const deleteArtisan = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/artisans/${id}`);
      setArtisans((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar artesano');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    artisans,
    loading,
    error,
    setArtisans,
    fetchArtisans,
    createArtisan,
    editArtisan,
    deleteArtisan,
  };
} 