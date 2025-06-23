'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AppSidebar } from "@/app/dashboard/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/app/dashboard/components/sidebar";
import { useArtisans } from './hooks/useArtisans';
import { CreateArtisanSchema } from './models/artisan';
import { useDataStore } from '@/lib/store';

export default function ArtisansPage() {
  const {
    artisans,
    setArtisans,
    fetchArtisans,
    createArtisan,
    editArtisan,
    deleteArtisan,
  } = useArtisans();

  const { setArtisans: setGlobalArtisans, addArtisan, updateArtisan, removeArtisan } = useDataStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArtisan, setEditingArtisan] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    identification: '',
    active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const artisansData = await fetchArtisans();
        setGlobalArtisans(artisansData); // Sincronizar con store global
      } catch (error) {
        console.error('Error loading artisans:', error);
      }
    };
    loadData();
    // eslint-disable-next-line
  }, []);

  // Función para validar nombre en tiempo real
  const validateName = (name: string): string | null => {
    if (!name) return null;
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
      return 'El nombre solo puede contener letras y espacios';
    }
    if (name.length > 50) {
      return 'El nombre es muy largo (máximo 50 caracteres)';
    }
    return null;
  };

  // Función para validar identificación en tiempo real
  const validateIdentification = (identification: string): string | null => {
    if (!identification) return null;
    if (!/^\d+$/.test(identification)) {
      return 'La identificación solo puede contener números';
    }
    if (identification.length < 5) {
      return 'La identificación debe tener al menos 5 números';
    }
    if (identification.length > 10) {
      return 'La identificación debe tener máximo 10 números';
    }
    return null;
  };

  // Función para manejar cambios en el nombre
  const handleNameChange = (value: string) => {
    // Filtrar caracteres no permitidos
    const filteredValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setFormData({ ...formData, name: filteredValue });
    
    // Validar en tiempo real
    const error = validateName(filteredValue);
    setErrors(prev => ({ ...prev, name: error || '' }));
  };

  // Función para manejar cambios en la identificación
  const handleIdentificationChange = (value: string) => {
    // Filtrar caracteres no permitidos y limitar a 10 dígitos
    const filteredValue = value.replace(/[^\d]/g, '').slice(0, 10);
    setFormData({ ...formData, identification: filteredValue });
    
    // Validar en tiempo real
    const error = validateIdentification(filteredValue);
    setErrors(prev => ({ ...prev, identification: error || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validación previa con nuestras funciones personalizadas
    const nameError = validateName(formData.name);
    const identificationError = validateIdentification(formData.identification);
    
    if (nameError || identificationError) {
      setErrors({
        name: nameError || '',
        identification: identificationError || ''
      });
      toast.error('Por favor corrija los errores en el formulario');
      return;
    }
    
    // Validación con Zod
    const result = CreateArtisanSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      toast.error('Por favor corrija los errores en el formulario');
      return;
    }
    
    try {
      if (editingArtisan) {
        const updated = await editArtisan(editingArtisan, formData);
        if (updated) {
          setArtisans(Array.isArray(artisans) ? artisans.map(a => a.id === updated.id ? updated : a) : [updated]);
          updateArtisan(updated.id, updated); // Actualizar en store global
          toast.success('Artesano actualizada exitosamente');
        }
      } else {
        const created = await createArtisan(formData);
        if (created) {
          setArtisans([...artisans, created]);
          addArtisan(created); // Agregar al store global
          toast.success('Artesano registrado exitosamente');
        }
      }
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar artesano';
      
      // Manejar específicamente el error de identificación duplicada
      if (message.includes('identificación')) {
        setErrors({ identification: message });
        toast.error(message);
      } else {
      toast.error(message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      identification: '',
      active: true,
    });
    setEditingArtisan(null);
    setIsDialogOpen(false);
    setErrors({});
  };

  const handleEdit = (artisan: { id: number; name: string; identification: string; active: boolean }) => {
    setFormData({
      name: artisan.name,
      identification: artisan.identification,
      active: artisan.active,
    });
    setEditingArtisan(artisan.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const ok = await deleteArtisan(id);
      if (ok) {
        setArtisans(artisans.filter(a => a.id !== id));
        removeArtisan(id); // Remover del store global
        toast.success('Artesano eliminada exitosamente');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar artesano';
      toast.error(message);
    }
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
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Gestión de Artesanos</h2>
                <p className="text-muted-foreground">Registra y administra los artesanos</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="h-4 w-4 mr-2 text-primary" />
                    Nuevo Artesano
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingArtisan ? 'Editar Artesano' : 'Nuevo Artesano'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="mb-2 block">Nombre del Artesano <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Ej: Juana Pérez"
                        className={`text-base bg-background text-foreground border-border focus:border-primary ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                        maxLength={100}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1 font-medium">{errors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="identification" className="mb-2">Identificación <span className="text-red-500">*</span></Label>
                      <Input
                        id="identification"
                        value={formData.identification}
                        onChange={(e) => handleIdentificationChange(e.target.value)}
                        placeholder="Ej: 12345678 (5-10 números)"
                        className={`${errors.identification ? 'border-red-500 focus:border-red-500' : ''}`}
                        maxLength={10}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      {errors.identification && <p className="text-red-500 text-sm mt-1 font-medium">{errors.identification}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="active"
                        checked={formData.active}
                        onChange={e => setFormData({ ...formData, active: e.target.checked })}
                      />
                      <Label htmlFor="active">Activo</Label>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-800 text-white">
                        {editingArtisan ? 'Actualizar' : 'Registrar'}
                      </Button>
                      <Button type="button" variant="default" onClick={resetForm}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {/* Lista de artesanas */}
            <div className="grid gap-4">
              {!Array.isArray(artisans) || artisans.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      No hay artesanos registrados
                    </p>
                  </CardContent>
                </Card>
              ) : (
                Array.isArray(artisans) && artisans.map((artisan) => (
                  <Card key={artisan.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-2 px-5 bg-background">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-2xl text-foreground">
                            {artisan.name}
                          </h3>
                            <Badge 
                              variant={artisan.active ? "default" : "destructive"}
                              className={artisan.active ? "bg-green-100 text-green-800 border-green-200" : ""}
                            >
                              {artisan.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                          <div className="text-md text-gray-800">
                            <p>Identificación: {artisan.identification}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(artisan)}
                            className="text-blue-600 bg-white border-1 border-blue-600 hover:text-white hover:bg-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDelete(artisan.id)}
                            className="text-red-600 bg-white border-1 border-red-600 hover:text-white hover:bg-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
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
