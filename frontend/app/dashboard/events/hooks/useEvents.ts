import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { 
  EventListSchema, 
  Event, 
  CreateEventSchema, 
  CreateEvent, 
  EventSummary, 
  EventSummarySchema 
} from '../models/event';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET - Obtener todos los eventos
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/events');
      const data = EventListSchema.parse(res.data);
      setEvents(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar eventos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // GET - Obtener evento por ID
  const fetchEventById = async (id: number): Promise<Event | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/events/${id}`);
      return res.data as Event;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar evento';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // CREATE - Crear nuevo evento
  const createEvent = async (event: CreateEvent) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateEventSchema.parse(event);
      const res = await apiClient.post('/events', parsed);
      setEvents((prev) => [...prev, res.data]);
      return res.data as Event;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al crear evento';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // EDIT - Actualizar evento
  const editEvent = async (id: number, event: Partial<CreateEvent>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.patch(`/events/${id}`, event);
      setEvents((prev) => prev.map((e) => (e.id === id ? res.data : e)));
      return res.data as Event;
    } catch (err: unknown) {
      // Extraer el mensaje específico del backend
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al editar evento';
      setError(errorMessage);
      throw new Error(errorMessage); // Lanzar error para que el componente lo maneje
    } finally {
      setLoading(false);
    }
  };

  // DELETE - Eliminar evento
  const deleteEvent = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/events/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al eliminar evento';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // GET - Resumen del evento
  const getEventSummary = async (id: number): Promise<EventSummary | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/events/${id}/summary`);
      const data = EventSummarySchema.parse(res.data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener resumen del evento';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // PATCH - Cerrar evento
  const closeEvent = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.patch(`/events/${id}/close`);
      setEvents((prev) => prev.map((e) => (e.id === id ? res.data : e)));
      return res.data as Event;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al cerrar evento';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // GET - Buscar eventos por nombre
  const searchEventsByName = async (name: string): Promise<Event[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/events/search/by-name?name=${encodeURIComponent(name)}`);
      const data = EventListSchema.parse(res.data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al buscar eventos';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // GET - Resumen contable del evento
  const getEventAccountingSummary = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/events/${id}/accounting-summary`);
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener resumen contable';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // GET - Descargar PDF del resumen contable
  const downloadEventAccountingPdf = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/events/${id}/accounting-summary/pdf`, {
        responseType: 'blob',
      });
      
      // Crear un enlace de descarga
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evento_${id}_resumen.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al descargar PDF';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cargar eventos automáticamente al montar el hook
  useEffect(() => {
    fetchEvents();
  }, []);

  // Funciones auxiliares para filtrado
  const getEventsByStatus = (status: string) => {
    return events.filter(event => event.status === status);
  };

  const getEventsByState = (state: string) => {
    return events.filter(event => event.state === state);
  };

  const searchEventsByNameLocal = (name: string) => {
    return events.filter(event => 
      event.name.toLowerCase().includes(name.toLowerCase())
    );
  };

  const getEventsByDateRange = (startDate: string, endDate: string) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      
      return eventStart >= filterStart && eventEnd <= filterEnd;
    });
  };

  const getEventsOrderedByDate = (ascending: boolean = true) => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });
  };

  const getEventsOrderedByName = () => {
    return [...events].sort((a, b) => a.name.localeCompare(b.name));
  };

  const getUniqueLocations = () => {
    const locations = events.map(event => event.location).filter(Boolean);
    return [...new Set(locations)].sort();
  };

  return {
    events,
    loading,
    error,
    setEvents,
    fetchEvents,
    fetchEventById,
    createEvent,
    editEvent,
    deleteEvent,
    getEventSummary,
    closeEvent,
    searchEventsByName,
    getEventAccountingSummary,
    downloadEventAccountingPdf,
    // Funciones auxiliares
    getEventsByStatus,
    getEventsByState,
    searchEventsByNameLocal,
    getEventsByDateRange,
    getEventsOrderedByDate,
    getEventsOrderedByName,
    getUniqueLocations,
  };
}
