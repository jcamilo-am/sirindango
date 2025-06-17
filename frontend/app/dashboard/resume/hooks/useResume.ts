import { useMemo } from 'react';
import { ResumeEventSchema, ResumeArtisanSchema } from '../models/resume';
import type { Sale } from '../../sales/models/sale';
import type { Event } from '../../events/models/event';
import type { Artisan } from '../../artisans/models/artisan';

// Tipo local para el objeto agrupado
interface ResumeArtisanGroup {
  artisanId: number;
  name: string;
  totalRevenue: number;
  totalProducts: number;
  sales: Sale[];
}

interface UseResumeProps {
  events: Event[];
  sales: Sale[];
  artisans: Artisan[];
  isLoading: boolean;
}

export function useResume({ events, sales, artisans, isLoading }: UseResumeProps) {
  // Verificar si todos los datos están cargados
  const hasData = events.length > 0 && artisans.length > 0;

  // Calcula el resumen de todos los eventos
  const eventSummaries = useMemo(() => {
    // No calcular si aún está cargando o no hay datos básicos
    if (isLoading || !hasData) {
      return [];
    }
    
    try {
      const summaries = events.map(event => {
        const eventSales = sales.filter(sale => sale.eventId === event.id);
        const totalRevenue = eventSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalProducts = eventSales.reduce((sum, sale) => sum + sale.quantitySold, 0);
        const uniqueArtisans = new Set(eventSales.map(sale => sale.artisanId)).size;
        const salesCount = eventSales.length;
        
        const resumeData = {
          ...event,
          totalRevenue,
          totalProducts,
          uniqueArtisans,
          salesCount,
        };
        
        return ResumeEventSchema.parse(resumeData);
      });
      
      return summaries;
    } catch (error) {
      console.error('Error en eventSummaries:', error);
      return [];
    }
  }, [events, sales, isLoading, hasData]);

  // Calcula el resumen de artesanas para un evento
  const getArtisanSummaryByEvent = (eventId: number) => {
    // No calcular si aún está cargando o no hay datos básicos
    if (isLoading || !hasData) {
      return [];
    }
    
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
    
    const result = Array.from(grouped.values()).map(a => {
      try {
        return ResumeArtisanSchema.parse(a);
      } catch (schemaError) {
        console.error('Error en ResumeArtisanSchema:', schemaError);
        return a;
      }
    });
    
    return result;
  };

  return {
    eventSummaries,
    getArtisanSummaryByEvent,
    isLoading,
  };
} 