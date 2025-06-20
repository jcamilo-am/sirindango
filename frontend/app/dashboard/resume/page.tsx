'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/app/dashboard/components/sidebar"
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Obtener el resumen del evento seleccionado
  const selectedEventSummary = selectedEventId 
    ? eventSummaries.find((e: { id: number }) => e.id === selectedEventId)
    : null;

  // Obtener el resumen de artesanas para el evento seleccionado
  const artisanSales = selectedEventId 
    ? getArtisanSummaryByEvent(selectedEventId)
    : [];

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const isLoading = isGeneralLoading || resumeLoading;

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
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
                <div className="text-center text-gray-400 py-8">
                  No hay eventos ni ventas registradas.
                </div>
              )}

              {/* Event Summary */}
              {selectedEvent && selectedEventSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      Resumen de evento: {selectedEvent.name}
                    </CardTitle>
                    <CardDescription className='font-italic'>
                      {selectedEvent.location} - {new Date(selectedEvent.startDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-900">Ingresos Totales</p>
                        <p className="text-3xl font-bold text-green-600">
                          ${selectedEventSummary.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-900">Productos Vendidos</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {selectedEventSummary.totalProducts}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-900">Artesanas Participantes</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {selectedEventSummary.uniqueArtisans}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-900">Transacciones</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {selectedEventSummary.salesCount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Artisan Sales Details */}
              {selectedEvent && artisanSales.length > 0 &&
                artisanSales.map((artisanData: { artisanId: number; name: string; totalRevenue: number; totalProducts: number; sales: unknown[] }, index: number) => (
                  <Card key={artisanData.artisanId} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-3xl text-white">
                              {artisanData.name}
                            </h4>
                            <Badge variant="secondary">#{index + 1}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-300">Ingresos</p>
                              <p className="font-bold text-3xl text-green-600">
                                ${artisanData.totalRevenue.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm  text-gray-300">Productos Vendidos</p>
                              <p className="font-bold text-3xl text-blue-600">
                                {artisanData.totalProducts}
                              </p>
                            </div>
                          </div>
                          <div className="text-md text-gray-400">
                            {artisanData.sales.length} transacciones realizadas
                          </div>
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