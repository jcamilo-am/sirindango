'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/app/dashboard/components/sidebar"
import { SiteHeader } from "@/app/dashboard/components/site-header"
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useEvents } from '../events/hooks/useEvents';
import { useSales } from '../sales/hooks/useSales';
import { useArtisans } from '../artisans/hooks/useArtisans';
import { useResume } from './hooks/useResume';

export default function ResumePage() {
  const { events, fetchEvents, loading: eventsLoading } = useEvents();
  const { sales, fetchSales, loading: salesLoading } = useSales();
  const { artisans, fetchArtisans, loading: artisansLoading } = useArtisans();
  
  // Calcular el estado de carga general
  const isGeneralLoading = eventsLoading || salesLoading || artisansLoading;
  
  // Usar el hook de resumen pasándole los datos
  const { eventSummaries, getArtisanSummaryByEvent, isLoading: resumeLoading } = useResume({
    events,
    sales,
    artisans,
    isLoading: isGeneralLoading,
  });

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchSales();
    fetchArtisans();
    // eslint-disable-next-line
  }, []);

  // Obtener el resumen del evento seleccionado
  const selectedEventSummary = selectedEventId 
    ? eventSummaries.find(e => e.id === selectedEventId)
    : null;

  // Obtener el resumen de artesanas para el evento seleccionado
  const artisanSales = selectedEventId 
    ? getArtisanSummaryByEvent(selectedEventId)
    : [];

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const isLoading = isGeneralLoading || resumeLoading;

import { useProducts } from '../products/hooks/useProducts';
import { useArtisans } from '../artisans/hooks/useArtisans';

export default function ResumePage() {
  const { events, fetchEvents } = useEvents();
  const { sales, fetchSales } = useSales();
  const { products, fetchProducts } = useProducts();
  const { artisans, fetchArtisans } = useArtisans();

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchSales();
    fetchProducts();
    fetchArtisans();
    // eslint-disable-next-line
  }, []);

  // Filtra ventas, productos y artesanas por evento seleccionado
  const eventSales = selectedEventId ? sales.filter(s => s.eventId === selectedEventId) : [];
  const eventProducts = selectedEventId ? products.filter(p => p.eventId === selectedEventId) : [];
  const eventArtisans = selectedEventId
    ? artisans.filter(a => eventProducts.some(p => p.artisanId === a.id))
    : [];

  // Calcula estadísticas
  const totalRevenue = eventSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProducts = eventSales.reduce((sum, s) => sum + s.quantitySold, 0);
  const uniqueArtisans = new Set(eventSales.map(s => s.artisanId)).size;
  const salesCount = eventSales.length;

  // Agrupa ventas por artesana
  const artisanSales = eventArtisans.map(artisan => {
    const salesByArtisan = eventSales.filter(s => s.artisanId === artisan.id);
    return {
      artisan,
      totalRevenue: salesByArtisan.reduce((sum, s) => sum + s.totalAmount, 0),
      totalProducts: salesByArtisan.reduce((sum, s) => sum + s.quantitySold, 0),
      sales: salesByArtisan,
    };
  });

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Resumen de Ventas</h2>
                <p className="text-white">Análisis de ventas por evento y artesana</p>
              </div>

              {/* Loading indicator */}
              {isLoading && (
                <div className="text-center text-gray-400 py-8">
                  Cargando datos...
                </div>
              )}


              {/* Event Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seleccionar Evento</CardTitle>
                  <CardDescription>
                    Seleccione un evento para ver el resumen detallado de ventas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedEventId !== null ? selectedEventId.toString() : ''}
                    onValueChange={v => setSelectedEventId(Number(v))}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="text-base">
                      <SelectValue placeholder="Seleccionar evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map(event => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.name} - {event.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>


              {/* Mensaje si no hay eventos */}
              {!isLoading && events.length === 0 && (

              {/* Mensaje si no hay eventos */}
              {events.length === 0 && (

                <div className="text-center text-gray-400 py-8">
                  No hay eventos ni ventas registradas.
                </div>
              )}

              {/* Event Summary */}
              {selectedEvent && selectedEventSummary && (

              {/* Event Summary */}
              {selectedEvent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Resumen: {selectedEvent.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedEvent.location} - {new Date(selectedEvent.startDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-black">Ingresos Totales</p>
                        <p className="text-xl font-bold text-green-600">
                          ${selectedEventSummary.totalRevenue.toLocaleString()}
                        <p className="text-sm text-gray-600">Ingresos Totales</p>
                        <p className="text-xl font-bold text-green-600">
                          ${totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Productos Vendidos</p>
                        <p className="text-xl font-bold text-blue-600">
                          {selectedEventSummary.totalProducts}

                          {totalProducts}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Artesanas Participantes</p>
                        <p className="text-xl font-bold text-purple-600">
                          {selectedEventSummary.uniqueArtisans}
                          {uniqueArtisans}

                        </p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Transacciones</p>
                        <p className="text-xl font-bold text-orange-600">
                          {selectedEventSummary.salesCount}

                          {salesCount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Artisan Sales Details */}
              {selectedEvent && artisanSales.length > 0 &&
                artisanSales.map((artisanData, index) => (
                  <Card key={artisanData.artisanId} className="border-l-4 border-l-orange-500">

              {/* Artisan Sales Details */}
              {selectedEvent && artisanSales.length > 0 &&
                artisanSales.map((artisanData, index) => (
                  <Card key={artisanData.artisan.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg text-white">
                              {artisanData.name}
                            <h4 className="font-semibold text-lg text-gray-900">
                              {artisanData.artisan.name}
                            </h4>
                            <Badge variant="secondary">#{index + 1}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-300">Ingresos</p>
                              <p className="text-sm text-gray-600">Ingresos</p>
                              <p className="font-semibold text-green-600">
                                ${artisanData.totalRevenue.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-300">Productos Vendidos</p>

                              <p className="text-sm text-gray-600">Productos Vendidos</p>
                              <p className="font-semibold text-blue-600">
                                {artisanData.totalProducts}
                              </p>
                            </div>
                          </div>
                          {/* Detalle de ventas */}
                          <div className="text-xs text-gray-400">
                            {artisanData.sales.length} transacciones realizadas
                          </div>
                          {/* Puedes mostrar el detalle de ventas aquí si lo deseas */}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              }

              {/* Mensaje si no hay ventas para el evento seleccionado */}
              {selectedEvent && artisanSales.length === 0 && !isLoading && (
                <div className="text-center text-gray-400 py-8">
                  No hay ventas registradas para este evento.
                </div>
              )}

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
