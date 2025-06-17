"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { BarChart3, TrendingUp, Users, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  const { 
    products, 
    events, 
    artisans, 
    sales,
    getSalesByEvent,
    getSalesByArtisan
  } = useStore();
  
  const [selectedEvent, setSelectedEvent] = useState('');

  const getArtisanName = (artisanId: string) => {
    return artisans.find(a => a.id === artisanId)?.name || 'Desconocido';
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Desconocido';
  };

  const getEventSummary = (eventId: string) => {
    const eventSales = getSalesByEvent(eventId);
    const totalRevenue = eventSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProducts = eventSales.reduce((sum, sale) => sum + sale.quantitySold, 0);
    const uniqueArtisans = new Set(eventSales.map(sale => sale.artisanId)).size;
    
    return {
      totalRevenue,
      totalProducts,
      uniqueArtisans,
      salesCount: eventSales.length
    };
  };

  const getArtisanSalesByEvent = (eventId: string) => {
    const eventSales = getSalesByEvent(eventId);
    const artisanSales = new Map();
    
    eventSales.forEach(sale => {
      const artisanId = sale.artisanId;
      if (!artisanSales.has(artisanId)) {
        artisanSales.set(artisanId, {
          artisanId,
          totalRevenue: 0,
          totalProducts: 0,
          sales: []
        });
      }
      
      const artisanData = artisanSales.get(artisanId);
      artisanData.totalRevenue += sale.totalAmount;
      artisanData.totalProducts += sale.quantitySold;
      artisanData.sales.push(sale);
    });
    
    return Array.from(artisanSales.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  const selectedEventData = selectedEvent ? events.find(e => e.id === selectedEvent) : null;
  const eventSummary = selectedEvent ? getEventSummary(selectedEvent) : null;
  const artisanSales = selectedEvent ? getArtisanSalesByEvent(selectedEvent) : [];

  // Overall statistics
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProducts = products.length;
  const totalArtisans = artisans.length;
  const totalEvents = events.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resumen de Ventas</h2>
        <p className="text-gray-600">Análisis de ventas por evento y artesana</p>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Productos</p>
                <p className="text-2xl font-bold text-blue-600">{totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Artesanas</p>
                <p className="text-2xl font-bold text-purple-600">{totalArtisans}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ferias</p>
                <p className="text-2xl font-bold text-orange-600">{totalEvents}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar Evento</CardTitle>
          <CardDescription>
            Seleccione un evento para ver el resumen detallado de ventas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="text-base">
              <SelectValue placeholder="Seleccionar evento" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name} - {event.location} ({event.date})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Event Summary */}
      {selectedEventData && eventSummary && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Resumen: {selectedEventData.name}
              </CardTitle>
              <CardDescription>
                {selectedEventData.location} - {selectedEventData.date}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Ingresos Totales</p>
                  <p className="text-xl font-bold text-green-600">
                    ${eventSummary.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Productos Vendidos</p>
                  <p className="text-xl font-bold text-blue-600">
                    {eventSummary.totalProducts}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Artesanas Participantes</p>
                  <p className="text-xl font-bold text-purple-600">
                    {eventSummary.uniqueArtisans}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Transacciones</p>
                  <p className="text-xl font-bold text-orange-600">
                    {eventSummary.salesCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Artisan Sales Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ventas por Artesana</CardTitle>
              <CardDescription>
                Desglose de ventas para cada artesana en el evento seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {artisanSales.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay ventas registradas para este evento</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {artisanSales.map((artisanData, index) => (
                    <Card key={artisanData.artisanId} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-lg text-gray-900">
                                {getArtisanName(artisanData.artisanId)}
                              </h4>
                              <Badge variant="secondary">#{index + 1}</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-gray-600">Ingresos</p>
                                <p className="font-semibold text-green-600">
                                  ${artisanData.totalRevenue.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Productos Vendidos</p>
                                <p className="font-semibold text-blue-600">
                                  {artisanData.totalProducts}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-700">Productos:</p>
                              {artisanData.sales.map((sale, saleIndex) => (
                                <div key={saleIndex} className="text-sm text-gray-600 ml-2">
                                  • {getProductName(sale.productId)} - {sale.quantitySold} unidades
                                  (${sale.totalAmount.toLocaleString()})
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}