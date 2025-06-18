import { useState, useEffect } from 'react';
import axios from 'axios';
import { EventListSchema, Event, CreateEventSchema, CreateEvent } from '../models/event';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/events`);
      const data = EventListSchema.parse(res.data);
      setEvents(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar eventos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // CREATE
  const createEvent = async (event: CreateEvent) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateEventSchema.parse(event);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/events`, parsed);
      setEvents((prev) => [...prev, res.data]);
      return res.data as Event;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear evento';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // EDIT
  const editEvent = async (id: number, event: Partial<CreateEvent>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/events/${id}`, event);
      setEvents((prev) => prev.map((e) => (e.id === id ? res.data : e)));
      return res.data as Event;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al editar evento';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const deleteEvent = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/events/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar evento';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cargar eventos automáticamente al montar el hook
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    events,
    loading,
    error,
    setEvents,
    fetchEvents,
    createEvent,
    editEvent,
    deleteEvent,
  };
}
