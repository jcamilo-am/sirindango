import { create } from 'zustand';

export interface Sale {
  id: number;
  artisanId: number;
  productId: number;
  eventId: number;
  quantitySold: number;
  totalAmount: number;
  date: Date;
}

export interface Event {
  id: number;
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  status: 'scheduled' | 'active' | 'finished';
}

export interface Artisan {
  id: number;
  name: string;
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