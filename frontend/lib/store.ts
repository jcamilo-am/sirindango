import { create } from 'zustand';

interface Sale {
  id: string;
  artisanId: string;
  productId: string;
  quantitySold: number;
  totalAmount: number;
}

interface Event {
  id: string;
  name: string;
  location: string;
  date: string;
}

interface Artisan {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

interface Store {
  products: Product[];
  events: Event[];
  artisans: Artisan[];
  sales: Sale[];
  getSalesByEvent: (eventId: string) => Sale[];
  getSalesByArtisan: (artisanId: string) => Sale[];
}

// Datos de ejemplo
const mockProducts: Product[] = [
  { id: '1', name: 'Producto 1' },
  { id: '2', name: 'Producto 2' },
  { id: '3', name: 'Producto 3' },
];

const mockEvents: Event[] = [
  { id: '1', name: 'Feria 1', location: 'Ubicación 1', date: '2024-03-20' },
  { id: '2', name: 'Feria 2', location: 'Ubicación 2', date: '2024-03-25' },
];

const mockArtisans: Artisan[] = [
  { id: '1', name: 'Artesana 1' },
  { id: '2', name: 'Artesana 2' },
  { id: '3', name: 'Artesana 3' },
];

const mockSales: Sale[] = [
  { id: '1', artisanId: '1', productId: '1', quantitySold: 2, totalAmount: 100 },
  { id: '2', artisanId: '1', productId: '2', quantitySold: 1, totalAmount: 50 },
  { id: '3', artisanId: '2', productId: '3', quantitySold: 3, totalAmount: 150 },
];

export const useStore = create<Store>((set, get) => ({
  products: mockProducts,
  events: mockEvents,
  artisans: mockArtisans,
  sales: mockSales,
  getSalesByEvent: (eventId: string) => {
    // En una implementación real, esto filtraría las ventas por evento
    return get().sales;
  },
  getSalesByArtisan: (artisanId: string) => {
    return get().sales.filter(sale => sale.artisanId === artisanId);
  },
})); 