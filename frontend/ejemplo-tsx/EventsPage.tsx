"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import { Plus, Edit2, Calendar, MapPin, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EventsPage() {
  const { 
    events, 
    products,
    sales,
    addEvent, 
    updateEvent,
    getProductsByEvent,
    getSalesByEvent
  } = useStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    date: '',
    status: 'upcoming' as 'upcoming' | 'active' | 'completed'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.date) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    const eventData = {
      name: formData.name,
      location: formData.location,
      date: formData.date,
      status: formData.status
    };

    if (editingEvent) {
      updateEvent(editingEvent, eventData);
      toast.success('Evento actualizado exitosamente');
    } else {
      addEvent(eventData);
      toast.success('Evento creado exitosamente');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      date: '',
      status: 'upcoming'
    });
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (event: any) => {
    setFormData({
      name: event.name,
      location: event.location,
      date: event.date,
      status: event.status
    });
    setEditingEvent(event.id);
    setIsDialogOpen(true);
  };

  const getEventStats = (eventId: string) => {
    const eventProducts = getProductsByEvent(eventId);
    const eventSales = getSalesByEvent(eventId);
    const totalRevenue = eventSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const uniqueArtisans = new Set(eventProducts.map(p => p.artisanId)).size;
    
    return {
      productsCount: eventProducts.length,
      salesCount: eventSales.length,
      totalRevenue,
      uniqueArtisans
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Próximo';
      case 'active':
        return 'Activo';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Administración de Ferias</h2>
          <p className="text-gray-600">Gestiona los eventos y ferias artesanales</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Feria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Editar Feria' : 'Nueva Feria'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Feria *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Feria de Primavera"
                  className="text-base"
                />
              </div>
              
              <div>
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Ej: Plaza Central"
                  className="text-base"
                />
              </div>

              <div>
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="text-base"
                />
              </div>

              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Próximo</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                  {editingEvent ? 'Actualizar' : 'Crear'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events List */}
      <div className="grid gap-4">
        {sortedEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                No hay ferias registradas
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedEvents.map((event) => {
            const stats = getEventStats(event.id);
            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-xl text-gray-900 mb-1">
                            {event.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(event.date).toLocaleDateString('es-ES')}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(event.status)}>
                          {getStatusText(event.status)}
                        </Badge>
                      </div>

                      {/* Statistics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-600">Productos</p>
                          <p className="font-semibold text-blue-600">{stats.productsCount}</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-xs text-gray-600">Ventas</p>
                          <p className="font-semibold text-green-600">{stats.salesCount}</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-xs text-gray-600">Artesanas</p>
                          <p className="font-semibold text-purple-600">{stats.uniqueArtisans}</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-xs text-gray-600">Ingresos</p>
                          <p className="font-semibold text-orange-600">
                            ${stats.totalRevenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(event)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}