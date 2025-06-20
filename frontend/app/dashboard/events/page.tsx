'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Plus, Edit2, Calendar, TrendingUp, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AppSidebar } from "@/app/dashboard/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/app/dashboard/components/sidebar";
import { useEvents } from './hooks/useEvents';

interface EventForm {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  commissionAssociation: number;
  commissionSeller: number;
}

export default function EventsPage() {
  const {
    events,
    loading,
    createEvent,
    editEvent,
    closeEvent,
    getEventSummary,
    downloadEventAccountingPdf,
  } = useEvents();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<number | null>(null);
  const [eventToClose, setEventToClose] = useState<number | null>(null);
  const [isClosingEvent, setIsClosingEvent] = useState(false);
  const [formData, setFormData] = useState<EventForm>({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    commissionAssociation: 10,
    commissionSeller: 5,
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

    if (formData.commissionAssociation < 0 || formData.commissionAssociation > 100) {
      toast.error('La comisión de la asociación debe estar entre 0 y 100%');
      return false;
    }

    if (formData.commissionSeller < 0 || formData.commissionSeller > 100) {
      toast.error('La comisión del vendedor debe estar entre 0 y 100%');
      return false;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate < startDate) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
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
      endDate: new Date(formData.endDate).toISOString(),
      commissionAssociation: formData.commissionAssociation,
      commissionSeller: formData.commissionSeller,
    };
    
    try {
      if (editingEvent) {
        const updated = await editEvent(editingEvent, data);
        if (updated) {
          toast.success('Evento actualizado exitosamente');
          resetForm();
        }
      } else {
        const created = await createEvent(data);
        if (created) {
          toast.success('Evento registrado exitosamente');
          resetForm();
        }
      }
    } catch {
      toast.error('Error al procesar el evento');
    }
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
    setFormData({
      name: '',
      location: '',
      startDate: '',
      endDate: '',
      commissionAssociation: 10,
      commissionSeller: 5,
    });
  };

  // Handler para editar
  const handleEdit = (eventData: typeof events[number]) => {
    setFormData({
      name: eventData.name,
      location: eventData.location,
      startDate: new Date(eventData.startDate).toISOString().split('T')[0],
      endDate: new Date(eventData.endDate).toISOString().split('T')[0],
      commissionAssociation: eventData.commissionAssociation || 10,
      commissionSeller: eventData.commissionSeller || 5,
    });
    setEditingEvent(eventData.id);
    setIsDialogOpen(true);
  };

  // Handler para confirmar el cierre del evento
  const handleConfirmCloseEvent = async () => {
    if (!eventToClose) return;
    
    setIsClosingEvent(true);
    try {
      const closed = await closeEvent(eventToClose);
      if (closed) {
        toast.success('Evento cerrado exitosamente');
      }
    } catch {
      toast.error('Error al cerrar el evento');
    } finally {
      setIsClosingEvent(false);
      setEventToClose(null);
    }
  };

  // Handler para ver resumen
  const handleViewSummary = async (eventId: number) => {
    const summary = await getEventSummary(eventId);
    if (summary) {
      // Aquí podrías abrir un modal con el resumen o navegar a otra página
      console.log('Resumen del evento:', summary);
      toast.info('Funcionalidad de resumen disponible en consola');
    }
  };

  // Handler para descargar PDF
  const handleDownloadPdf = async (eventId: number) => {
    const success = await downloadEventAccountingPdf(eventId);
    if (success) {
      toast.success('PDF descargado exitosamente');
    }
  };

  // Obtener el nombre del evento que se va a cerrar
  const getEventNameToClose = () => {
    const event = events.find(e => e.id === eventToClose);
    return event?.name || 'evento';
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="commissionAssociation">Comisión Asociación (%)</Label>
                        <Input
                          id="commissionAssociation"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="10"
                          value={formData.commissionAssociation}
                          onChange={(e) => setFormData({ ...formData, commissionAssociation: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="commissionSeller">Comisión Vendedor (%)</Label>
                        <Input
                          id="commissionSeller"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="5"
                          value={formData.commissionSeller}
                          onChange={(e) => setFormData({ ...formData, commissionSeller: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={resetForm}>
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
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-3xl font-bold text-gray-900">{event.name}</h3>
                            {event.state === 'CLOSED' && (
                              <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full">
                                Cerrado
                              </span>
                            )}
                            {event.state === 'ACTIVE' && (
                              <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 mb-2">📍 {event.location}</p>
                          <div className="flex items-center text-sm font-semibold text-gray-900 mb-2">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>
                              {new Date(event.startDate).toLocaleDateString('es-ES')} - {new Date(event.endDate).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-900">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>Comisión Asociación: {event.commissionAssociation || 0}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              <span>Comisión Vendedor: {event.commissionSeller || 0}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleEdit(event)}
                              disabled={event.state === 'CLOSED'}
                              className="text-blue-600 border-1 border-blue-600 hover:bg-blue-600 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleViewSummary(event.id)}
                              className="text-green-600 border-1 border-green-600 hover:bg-green-600 hover:text-white transition-colors duration-200"
                            >
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleDownloadPdf(event.id)}
                              className="text-purple-600 border-1 border-purple-600 hover:bg-purple-600 hover:text-white transition-colors duration-200"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                          {event.state === 'ACTIVE' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                                                  <Button
                                                                  variant="default"
                                    size="sm"
                                    onClick={() => setEventToClose(event.id)}
                                    className="text-red-600 border-red-600 border-1  hover:bg-red-600 hover:text-white transition-colors duration-200"
                                  >
                                    Cerrar Evento
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                                                 <AlertDialogHeader>
                                   <AlertDialogTitle className="flex items-center gap-2">
                                     <AlertTriangle className="h-5 w-5 text-red-500" />
                                     Confirmar Cierre del Evento
                                   </AlertDialogTitle>
                                   <div className="space-y-4">
                                     <AlertDialogDescription>
                                       ¿Estás seguro de que quieres cerrar el evento <strong>&quot;{getEventNameToClose()}&quot;</strong>?
                                     </AlertDialogDescription>
                                     
                                     <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                       <p className="text-sm text-red-800 font-medium mb-2">
                                         Esta acción <strong>no se puede deshacer</strong> y tendrá las siguientes consecuencias:
                                       </p>
                                       <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                         <li>Bloqueará la creación de nuevos productos para este evento</li>
                                         <li>Bloqueará nuevas ventas para este evento</li>
                                         <li>Cambiará el estado del evento a &quot;Cerrado&quot;</li>
                                       </ul>
                                     </div>
                                   </div>
                                 </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setEventToClose(null)}>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleConfirmCloseEvent}
                                    disabled={isClosingEvent}
                                    className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                  >
                                    {isClosingEvent ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Cerrando...
                                      </>
                                    ) : (
                                      'Sí, Cerrar Evento'
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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