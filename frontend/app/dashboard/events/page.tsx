'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Plus, Edit2, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppSidebar } from "@/app/dashboard/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/app/dashboard/components/sidebar";
import { useEvents } from './hooks/useEvents';

interface EventForm {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
}

export default function EventsPage() {
  const {
    events,
    loading,
    createEvent,
    editEvent,
  } = useEvents();



  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<number | null>(null);
  const [formData, setFormData] = useState<EventForm>({
    name: '',
    location: '',
    startDate: '',
    endDate: ''
  });

  // Función para validar el formulario
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('El nombre del evento es obligatorio');
      return false;
    }
    
    if (!formData.location.trim()) {
      toast.error('La ubicación del evento es obligatoria');
      return false;
    }
    
    if (!formData.startDate) {
      toast.error('La fecha de inicio es obligatoria');
      return false;
    }
    
    if (!formData.endDate) {
      toast.error('La fecha de fin es obligatoria');
      return false;
    }
    
    return true;
  };

  // Handler para crear o editar evento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const data = {
      name: formData.name.trim(),
      location: formData.location.trim(),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString()
    };
    
    try {
      if (editingEvent) {
        const updated = await editEvent(editingEvent, data);
        if (updated) {
          toast.success('Evento actualizado exitosamente');
          setIsDialogOpen(false);
          setEditingEvent(null);
          setFormData({ name: '', location: '', startDate: '', endDate: '' });
        }
      } else {
        const created = await createEvent(data);
        if (created) {
          toast.success('Evento registrado exitosamente');
          setIsDialogOpen(false);
          setEditingEvent(null);
          setFormData({ name: '', location: '', startDate: '', endDate: '' });
        }
      }
    } catch {
      toast.error('Error al procesar el evento');
    }
  };

  // Handler para editar
  const handleEdit = (eventData: typeof events[number]) => {
    setFormData({
      name: eventData.name,
      location: eventData.location,
      startDate: new Date(eventData.startDate).toISOString().split('T')[0],
      endDate: new Date(eventData.endDate).toISOString().split('T')[0]
    });
    setEditingEvent(eventData.id);
    setIsDialogOpen(true);
  };

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Gestión de Eventos</h2>
                <p className="text-gray-200">Administra los eventos/ferias registrados</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Evento</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Ej: Feria Artesanal de Diciembre"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        type="text"
                        placeholder="Ej: Plaza Mayor, Ciudad"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Fecha de Inicio</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">Fecha de Fin</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsDialogOpen(false);
                        setEditingEvent(null);
                        setFormData({ name: '', location: '', startDate: '', endDate: '' });
                      }}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        {editingEvent ? 'Actualizar' : 'Crear'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Lista de eventos */}
            <div className="grid gap-4 md:gap-6">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Cargando eventos...</span>
                </div>
              ) : !Array.isArray(events) || events.length === 0 ? (
                <Card className="bg-white/90 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center h-32">
                    <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">No hay eventos registrados</p>
                  </CardContent>
                </Card>
              ) : (
                Array.isArray(events) && events.map((event) => (
                  <Card key={event.id} className="bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.name}</h3>
                          <p className="text-gray-600 mb-2">📍 {event.location}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>
                              {new Date(event.startDate).toLocaleDateString('es-ES')} - {new Date(event.endDate).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(event)}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 