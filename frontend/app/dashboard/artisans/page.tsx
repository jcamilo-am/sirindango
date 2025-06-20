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
import { AppSidebar } from "@/app/dashboard/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/app/dashboard/components/sidebar";
import { useArtisans } from './hooks/useArtisans';
import { CreateArtisanSchema } from './models/artisan';

export default function ArtisansPage() {
  const {
    artisans,
    setArtisans,
    fetchArtisans,
    createArtisan,
    editArtisan,
    deleteArtisan,
  } = useArtisans();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArtisan, setEditingArtisan] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    identification: '',
    active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchArtisans();
    // eslint-disable-next-line
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
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
          setArtisans(artisans.map(a => a.id === updated.id ? updated : a));
          toast.success('Artesana actualizada exitosamente');
        }
      } else {
        const created = await createArtisan(formData);
        if (created) {
          setArtisans([...artisans, created]);
          toast.success('Artesana registrada exitosamente');
        }
      }
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar artesana';
      toast.error(message);
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
        toast.success('Artesana eliminada exitosamente');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar artesana';
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
                <h2 className="text-2xl font-bold text-foreground">Gestión de Artesanas</h2>
                <p className="text-muted-foreground">Registra y administra las artesanas</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                    <Plus className="h-4 w-4 mr-2 text-primary" />
                    Nueva Artesana
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingArtisan ? 'Editar Artesana' : 'Nueva Artesana'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="mb-2 block">Nombre de la Artesana *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Juana Pérez"
                        className={`text-base bg-background text-foreground border-border focus:border-primary ${errors.name ? 'border-red-500' : ''}`}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="identification">Identificación *</Label>
                      <Input
                        id="identification"
                        value={formData.identification}
                        onChange={e => setFormData({ ...formData, identification: e.target.value })}
                        placeholder="Ej: 12345678"
                        className={errors.identification ? 'border-red-500' : ''}
                      />
                      {errors.identification && <p className="text-red-500 text-sm mt-1">{errors.identification}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="active"
                        checked={formData.active}
                        onChange={e => setFormData({ ...formData, active: e.target.checked })}
                      />
                      <Label htmlFor="active">Activa</Label>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white">
                        {editingArtisan ? 'Actualizar' : 'Registrar'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {/* Lista de artesanas */}
            <div className="grid gap-4">
              {artisans.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      No hay artesanas registradas
                    </p>
                  </CardContent>
                </Card>
              ) : (
                artisans.map((artisan) => (
                  <Card key={artisan.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 bg-background">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground mb-2">
                            {artisan.name}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(artisan)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(artisan.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
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
