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
import { SiteHeader } from "@/app/dashboard/components/site-header";
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
    // Validar campos obligatorios
    if (!formData.name.trim()) {
      toast.error('El nombre del evento es obligatorio');
      return false;
    }
    
    if (formData.name.trim().length < 3) {
      toast.error('El nombre del evento debe tener al menos 3 caracteres');
      return false;
    }
    
    if (!formData.location.trim()) {
      toast.error('La ubicación del evento es obligatoria');
      return false;
    }
    
    if (formData.location.trim().length < 3) {
      toast.error('La ubicación debe tener al menos 3 caracteres');
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
    
    // Validar fechas
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    
    // Validar que las fechas no sean en el pasado (solo para eventos nuevos)
    if (!editingEvent) {
      if (startDate < today) {
        toast.error('La fecha de inicio no puede ser anterior a hoy');
        return false;
      }
    }
    
    // Validar que la fecha de fin no sea anterior a la fecha de inicio
    if (endDate < startDate) {
      toast.error('La fecha de fin no puede ser anterior a la fecha de inicio');
      return false;
    }
    
    // Validar que el evento no dure más de 30 días
    const diffInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffInDays > 30) {
      toast.error('El evento no puede durar más de 30 días');
      return false;
    }
    
    return true;
  };

  // Handler para crear o editar evento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario antes de enviar
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
        } else {
          toast.error('No se pudo actualizar el evento. Inténtalo de nuevo.');
        }
      } else {
        const created = await createEvent(data);
        if (created) {
          toast.success('Evento registrado exitosamente');
          setIsDialogOpen(false);
          setEditingEvent(null);
          setFormData({ name: '', location: '', startDate: '', endDate: '' });
        } else {
          toast.error('No se pudo crear el evento. Inténtalo de nuevo.');
        }
      }
    } catch (err: unknown) {
      let message = 'Error al procesar el evento';
      
      if (err instanceof Error) {
        // Manejar errores específicos del backend
        if (err.message.includes('400')) {
          message = 'Datos inválidos. Verifica la información ingresada.';
        } else if (err.message.includes('500')) {
          message = 'Error interno del servidor. Inténtalo más tarde.';
        } else if (err.message.includes('Network')) {
          message = 'Error de conexión. Verifica tu conexión a internet.';
        } else {
          message = err.message;
        }
      }
      
      toast.error(message);
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
        <SiteHeader />
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
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
                    <div>
                      <Label htmlFor="name" className="mb-2 block">Nombre del Evento *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Ej: Feria Artesanal Primavera"
                        className="text-base"
                        maxLength={100}
                        required
                      />
                      {formData.name && formData.name.trim().length < 3 && (
                        <p className="text-xs text-red-500 mt-1">Mínimo 3 caracteres</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="location" className="mb-2 block">Ubicación *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="Ej: Plaza Central"
                        className="text-base"
                        maxLength={100}
                        required
                      />
                      {formData.location && formData.location.trim().length < 3 && (
                        <p className="text-xs text-red-500 mt-1">Mínimo 3 caracteres</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="startDate" className="mb-2 block">Fecha de Inicio *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="text-base"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="mb-2 block">Fecha de Fin *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        className="text-base"
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        required
                      />
                      {formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate) && (
                        <p className="text-xs text-red-500 mt-1">La fecha de fin debe ser posterior a la fecha de inicio</p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="submit" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50" 
                        disabled={
                          !formData.name.trim() || 
                          !formData.location.trim() || 
                          !formData.startDate || 
                          !formData.endDate ||
                          formData.name.trim().length < 3 ||
                          formData.location.trim().length < 3 ||
                          (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) ||
                          loading
                        }
                      >
                        {loading ? 'Procesando...' : (editingEvent ? 'Actualizar' : 'Registrar')}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingEvent(null);
                          setFormData({ name: '', location: '', startDate: '', endDate: '' });
                        }}
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {/* Lista de eventos */}
            <div className="grid gap-4">
              {loading ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 mt-4">Cargando eventos...</p>
                  </CardContent>
                </Card>
              ) : events.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      No hay eventos registrados
                    </p>
                  </CardContent>
                </Card>
              ) : (
                events.map((event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-3xl text-white mb-2">
                            {event.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-sm text-gray-300">Ubicación: {event.location}</span>
                            <span className="text-sm text-gray-300">Inicio: {new Date(event.startDate).toLocaleDateString()}</span>
                            <span className="text-sm text-gray-300">Fin: {new Date(event.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(event)}
                            className="border-blue-600 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="text-white">Editar evento</span>
                          </Button>
                        </div>
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
