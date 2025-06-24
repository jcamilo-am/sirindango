'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Plus, Edit2, Calendar, TrendingUp, DollarSign, FileText, AlertTriangle, Filter, X } from 'lucide-react';
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
    downloadEventAccountingPdf,
    getUniqueLocations,
  } = useEvents();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<number | null>(null);
  const [eventToClose, setEventToClose] = useState<number | null>(null);
  const [isClosingEvent, setIsClosingEvent] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState<EventForm>({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    commissionAssociation: 10,
    commissionSeller: 5,
  });

  // Estados para filtros
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all',
    state: 'all',
    location: 'all',
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
        await editEvent(editingEvent, data);
          toast.success('Evento actualizado exitosamente');
        resetForm();
      } else {
        await createEvent(data);
          toast.success('Evento registrado exitosamente');
        resetForm();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar el evento';
      toast.error(errorMessage);
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
      await closeEvent(eventToClose);
      toast.success('Evento cerrado exitosamente');
      setShowCloseDialog(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cerrar el evento';
      toast.error(errorMessage);
    } finally {
      setIsClosingEvent(false);
      setEventToClose(null);
      setHoldProgress(0);
      setIsHolding(false);
    }
  };

  // Handlers para el botón de mantener presionado
  const handleHoldStart = () => {
    if (isClosingEvent) return;
    setIsHolding(true);
    setHoldProgress(0);
    
    const interval = setInterval(() => {
      setHoldProgress(prev => {
        const newProgress = prev + (100 / 60); // 3 segundos = 60 intervalos de 50ms para más suavidad
        if (newProgress >= 100) {
          clearInterval(interval);
          handleConfirmCloseEvent();
          return 100;
        }
        return newProgress;
      });
    }, 50); // Intervalo más pequeño para mayor suavidad
    
    holdIntervalRef.current = interval;
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  // Handler para abrir el dialog de cierre
  const handleOpenCloseDialog = (eventId: number) => {
    setEventToClose(eventId);
    setShowCloseDialog(true);
  };

  // Handler para cerrar el dialog y resetear estados
  const handleCloseDialog = () => {
    setShowCloseDialog(false);
    setEventToClose(null);
    setHoldProgress(0);
    setIsHolding(false);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  // Handler para ver resumen
  // const handleViewSummary = async (eventId: number) => {
  //   const summary = await getEventSummary(eventId);
  //   if (summary) {
  //     // Aquí podrías abrir un modal con el resumen o navegar a otra página
  //     console.log('Resumen del evento:', summary);
  //     toast.info('Funcionalidad de resumen disponible en consola');
  //   }
  // };

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

  // Determinar si un evento puede ser cerrado
  const canCloseEvent = (event: typeof events[number]) => {
    // No puede cerrar si ya está cerrado manualmente
    if (event.state === 'CLOSED') return false;
    
    // Puede cerrar si el evento está activo (status ACTIVE) o si ya pasó la fecha de fin
    const now = new Date();
    const startDate = new Date(event.startDate);
    
    // Puede cerrar si:
    // 1. El evento ya inició (está ACTIVE o ya pasó la fecha de fin)
    // 2. No está cerrado manualmente
    return now >= startDate;
  };

  // Función para aplicar filtros
  const filteredEvents = events.filter(event => {
    // Filtro por término de búsqueda
    if (filters.searchTerm && !event.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtro por status
    if (filters.status !== 'all' && event.status !== filters.status) {
      return false;
    }
    
    // Filtro por estado
    if (filters.state !== 'all' && event.state !== filters.state) {
      return false;
    }
    
    // Filtro por ubicación
    if (filters.location !== 'all' && event.location !== filters.location) {
      return false;
    }
    
    return true;
  });

  // Función para limpiar filtros
  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      state: 'all',
      location: 'all',
    });
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = filters.searchTerm || filters.status !== 'all' || filters.state !== 'all' || filters.location !== 'all';

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
                <h2 className="text-2xl font-bold text-black">Gestión de Eventos</h2>
                <p className="text-gray-900">Administra los eventos/ferias registrados</p>
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
                      <Label htmlFor="name">Nombre del Evento <span className='text-red-500'>*</span></Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Ej: Feria Artesanal de Diciembre"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" >Ubicación<span className='text-red-500'>*</span></Label>
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
                        <Label htmlFor="startDate">Fecha de Inicio<span className='text-red-500'>*</span></Label>
                        <Input
                          id="startDate"
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">Fecha de Fin<span className='text-red-500'>*</span></Label>
                        <Input
                          id="endDate"
                          type="date"
                          min={formData.startDate || new Date().toISOString().split('T')[0]}
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
                      <Button type="button" onClick={resetForm}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-900">
                        {editingEvent ? 'Actualizar' : 'Crear'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filtros */}
            <Card className="bg-white/100 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 mb-0">
                    <Filter className="h-5 w-5" />
                    Filtros
                  </CardTitle>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpiar Filtros
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ">
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="search" className="text-sm font-medium">Buscar por nombre</Label>
                    <Input
                      id="search"
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      placeholder="Buscar eventos..."
                      className="w-full h-10"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="statusFilter" className="text-sm font-medium">Filtrar por Estado</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="SCHEDULED">Programado</SelectItem>
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="CLOSED">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="stateFilter" className="text-sm font-medium">Filtrar por Situación</Label>
                    <Select value={filters.state} onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="Todas las situaciones" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las situaciones</SelectItem>
                        <SelectItem value="SCHEDULED">Programado</SelectItem>
                        <SelectItem value="CLOSED">Cerrado manualmente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="locationFilter" className="text-sm font-medium">Filtrar por Ubicación</Label>
                    <Select value={filters.location} onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="Todas las ubicaciones">
                          <span className="truncate">
                            {filters.location === 'all' ? 'Todas las ubicaciones' : filters.location}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-w-[280px]">
                        <SelectItem value="all">Todas las ubicaciones</SelectItem>
                        {getUniqueLocations().map((location) => (
                          <SelectItem key={location} value={location} className="truncate">
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de eventos */}
            <div className="grid gap-4 md:gap-6">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Cargando eventos...</span>
                </div>
              ) : !Array.isArray(filteredEvents) || filteredEvents.length === 0 ? (
                <Card className="bg-white/90 backdrop-blur-md">
                  <CardContent className="flex flex-col items-center justify-center h-32">
                    <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      {events.length === 0 
                        ? "No hay eventos registrados"
                        : "No hay eventos que coincidan con los filtros seleccionados"
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                Array.isArray(filteredEvents) && filteredEvents.map((event) => (
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
                            {event.status === 'ACTIVE' && (
                              <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                                Activo
                              </span>
                            )}
                            {event.status === 'CLOSED' && event.state !== 'CLOSED' && (
                              <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
                                Finalizado
                              </span>
                            )}
                            {event.status === 'SCHEDULED' && (
                              <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                                Programado
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
                          size="sm"
                          onClick={() => handleEdit(event)}
                              disabled={event.state === 'CLOSED'}
                              className="text-white bg-blue-600 border-1 border-blue-600 hover:bg-blue-800 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDownloadPdf(event.id)}
                              className="text-white bg-green-600 border-1 border-green-600 hover:bg-green-800 hover:text-white transition-colors duration-200"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                          {canCloseEvent(event) && (
                            <AlertDialog open={showCloseDialog && eventToClose === event.id} onOpenChange={(open) => !open && handleCloseDialog()}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleOpenCloseDialog(event.id)}
                                  className="text-white bg-red-500 border-red-600 border-1  hover:bg-red-800 hover:text-white transition-colors duration-200"
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
                                   <div className="space-y-2">
                                     <AlertDialogDescription>
                                       ¿Estás seguro de que quieres cerrar el evento <strong>&quot;{getEventNameToClose()}&quot;</strong>?
                                     </AlertDialogDescription>
                                     
                                     <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                       <p className="text-sm text-red-800 font-medium">
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
                                 <div className='text-xs text-gray-600 '>Manten presionado el botón para cerrar el evento</div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className='hover:bg-black/70' onClick={() => handleCloseDialog()}>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onMouseDown={handleHoldStart}
                                    onMouseUp={handleHoldEnd}
                                    onMouseLeave={handleHoldEnd}
                                    onTouchStart={handleHoldStart}
                                    onTouchEnd={handleHoldEnd}
                                    disabled={isClosingEvent}
                                    className="relative overflow-hidden bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                  >
                                    {/* Barra de progreso */}
                                    <div 
                                      className="absolute inset-0 bg-white transition-all duration-75 ease-out"
                                      style={{ 
                                        width: `${holdProgress}%`,
                                        opacity: isHolding ? 0.3 : 0,
                                        transform: 'translateZ(0)', // Para activar aceleración por hardware
                                      }}
                                    />
                                    
                                    {/* Contenido del botón */}
                                    <span className="relative z-10">
                                      {isClosingEvent ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                          Cerrando...
                                        </>
                                      ) : isHolding ? (
                                        'Mantén presionado...'
                                      ) : (
                                        'Sí, Cerrar Evento'
                                      )}
                                    </span>
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