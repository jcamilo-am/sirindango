import { useMemo } from 'react';
import { ResumeEventSchema, ResumeArtisanSchema } from '../models/resume';
import { useArtisans } from '../../artisans/hooks/useArtisans';
import { useEvents } from '../../events/hooks/useEvents';
import { useSales } from '../../sales/hooks/useSales';
import type { Sale } from '../../sales/models/sale';

// Tipo local para el objeto agrupado
interface ResumeArtisanGroup {
  artisanId: number;
  name: string;
  totalRevenue: number;
  totalProducts: number;
  sales: Sale[];
}

export function useResume() {
  const { artisans } = useArtisans();
  const { events } = useEvents();
  const { sales } = useSales();

  // Calcula el resumen de todos los eventos
  const eventSummaries = useMemo(() => {
    return events.map(event => {
      const eventSales = sales.filter(sale => sale.eventId === event.id);
      const totalRevenue = eventSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const totalProducts = eventSales.reduce((sum, sale) => sum + sale.quantitySold, 0);
      const uniqueArtisans = new Set(eventSales.map(sale => sale.artisanId)).size;
      const salesCount = eventSales.length;
      return ResumeEventSchema.parse({
        ...event,
        totalRevenue,
        totalProducts,
        uniqueArtisans,
        salesCount,
      });
    });
  }, [events, sales]);

  // Calcula el resumen de artesanas para un evento
  const getArtisanSummaryByEvent = (eventId: number) => {
    const eventSales = sales.filter(sale => sale.eventId === eventId);
    const grouped = new Map<number, ResumeArtisanGroup>();
    eventSales.forEach(sale => {
      if (!grouped.has(sale.artisanId)) {
        const artisan = artisans.find(a => a.id === sale.artisanId);
        grouped.set(sale.artisanId, {
          artisanId: sale.artisanId,
          name: artisan?.name || 'Desconocido',
          totalRevenue: 0,
          totalProducts: 0,
          sales: [],
        });
      }
      const group = grouped.get(sale.artisanId)!;
      group.totalRevenue += sale.totalAmount;
      group.totalProducts += sale.quantitySold;
      group.sales.push(sale);
    });
    return Array.from(grouped.values()).map(a => ResumeArtisanSchema.parse(a));
  };

  return {
    eventSummaries,
    getArtisanSummaryByEvent,
  };
} 