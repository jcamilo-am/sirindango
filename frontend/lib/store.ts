import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Artisan } from '@/app/dashboard/artisans/models/artisan';
import { Event } from '@/app/dashboard/events/models/event';

export interface Sale {
  id: number;
  artisanId: number;
  productId: number;
  eventId: number;
  quantitySold: number;
  totalAmount: number;
  date: Date;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  availableQuantity: number;
  eventId: number;
  artisanId: number;
  category?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: number;
    email: string;
    role: string;
  } | null;
  login: (user: { id: number; email: string; role: string }) => void;
  logout: () => void;
}

interface DataState {
  artisans: Artisan[];
  events: Event[];
  setArtisans: (artisans: Artisan[]) => void;
  setEvents: (events: Event[]) => void;
  addArtisan: (artisan: Artisan) => void;
  updateArtisan: (id: number, artisan: Partial<Artisan>) => void;
  removeArtisan: (id: number) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: number, event: Partial<Event>) => void;
  removeEvent: (id: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useDataStore = create<DataState>((set) => ({
  artisans: [],
  events: [],
  setArtisans: (artisans) => set({ artisans }),
  setEvents: (events) => set({ events }),
  addArtisan: (artisan) => set((state) => ({ 
    artisans: [...state.artisans, artisan] 
  })),
  updateArtisan: (id, updatedArtisan) => set((state) => ({
    artisans: state.artisans.map(artisan => 
      artisan.id === id ? { ...artisan, ...updatedArtisan } : artisan
    )
  })),
  removeArtisan: (id) => set((state) => ({
    artisans: state.artisans.filter(artisan => artisan.id !== id)
  })),
  addEvent: (event) => set((state) => ({ 
    events: [...state.events, event] 
  })),
  updateEvent: (id, updatedEvent) => set((state) => ({
    events: state.events.map(event => 
      event.id === id ? { ...event, ...updatedEvent } : event
    )
  })),
  removeEvent: (id) => set((state) => ({
    events: state.events.filter(event => event.id !== id)
  })),
}));

interface Store {
  products: Product[];
  events: Event[];
  artisans: Artisan[];
  sales: Sale[];
  getSalesByEvent: (eventId: number) => Sale[];
  getSalesByArtisan: (artisanId: number) => Sale[];
}

export const useStore = create<Store>((set, get) => ({
  products: [],
  events: [],
  artisans: [],
  sales: [],
  getSalesByEvent: (eventId: number) => {
    return get().sales.filter(sale => sale.eventId === eventId);
  },
  getSalesByArtisan: (artisanId: number) => {
    return get().sales.filter(sale => sale.artisanId === artisanId);
  },
})); 