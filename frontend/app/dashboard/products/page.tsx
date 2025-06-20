'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppSidebar } from "@/app/dashboard/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/app/dashboard/components/sidebar";
import type { Product, Event, Artisan } from '@/lib/store';
import { useProducts } from './hooks/useProducts';
import { CreateProductSchema } from './models/product';

export default function RegistrarProductoPage() {
  const {
    products,
    setProducts,
    fetchProducts,
    createProduct,
    editProduct,
    deleteProduct,
  } = useProducts();

  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedArtisan, setSelectedArtisan] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    availableQuantity: '',
    category: '',
    price: '',
    eventId: '',
    artisanId: ''
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const categories = ['Textiles', 'Cerámica', 'Joyería', 'Tallado', 'Otros'];

  // Solo fetch de productos con el hook, eventos y artesanas con fetch propio
  useEffect(() => {
    fetchProducts();
    fetchEvents();
    fetchArtisans();
    // eslint-disable-next-line
  }, []);

  // Fetch de eventos y artesanas (puedes reemplazar por tu API real)
  const fetchEvents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`);
      const data = await res.json();
      setEvents(data);
    } catch {
      toast.error('Error al cargar eventos');
    }
  };
  const fetchArtisans = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artisans`);
      const data = await res.json();
      setArtisans(data);
    } catch {
      toast.error('Error al cargar artesanas');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const productData = {
      name: formData.name,
      price: Number(formData.price),
      availableQuantity: Number(formData.availableQuantity),
      eventId: Number(formData.eventId),
      artisanId: Number(formData.artisanId),
      category: formData.category,
    };
    const result = CreateProductSchema.safeParse(productData);
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
      if (editingProduct) {
        const updated = await editProduct(Number(editingProduct), productData);
        if (updated) {
          setProducts(products.map(p => p.id === updated.id ? updated : p));
          toast.success('Producto actualizado exitosamente');
        }
      } else {
        const created = await createProduct(productData);
        if (created) {
          setProducts([...products, created]);
          toast.success('Producto registrado exitosamente');
        }
      }
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar producto';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      availableQuantity: '',
      category: '',
      price: '',
      eventId: '',
      artisanId: ''
    });
    setEditingProduct(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      availableQuantity: product.availableQuantity.toString(),
      category: product.category || '',
      price: product.price.toString(),
      eventId: product.eventId.toString(),
      artisanId: product.artisanId.toString()
    });
    setEditingProduct(product.id.toString());
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const ok = await deleteProduct(id);
      if (ok) {
        setProducts(products.filter(p => p.id !== id));
        toast.success('Producto eliminado exitosamente');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar producto';
      toast.error(message);
    }
  };

  const filteredProducts = products.filter(product => {
    if (selectedEvent && product.eventId.toString() !== selectedEvent) return false;
    if (selectedArtisan && product.artisanId.toString() !== selectedArtisan) return false;
    return true;
  });

  const getArtisanName = (artisanId: string) => {
    return artisans.find(a => a.id.toString() === artisanId)?.name || 'Desconocido';
  };
  const getEventName = (eventId: string) => {
    return events.find(e => e.id.toString() === eventId)?.name || 'Desconocido';
  };
  const handleEventFilterChange = (value: string) => {
    setSelectedEvent(value === 'all' ? '' : value);
  };
  const handleArtisanFilterChange = (value: string) => {
    setSelectedArtisan(value === 'all' ? '' : value);
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
                <h2 className="text-2xl font-bold text-foreground">Gestión de Productos</h2>
                <p className="text-muted-foreground">Registra y administra los productos para las ferias</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus className="h-4 w-4 mr-2 text-primary" />
                    Nuevo Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="mb-2 block">Nombre del Producto *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Ej: Bolso tejido a mano"
                        className={`text-base bg-background text-foreground border-border focus:border-primary ${errors.name ? 'border-red-500' : ''}`}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantity" className="mb-2 block">Cantidad *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={formData.availableQuantity}
                          onChange={(e) => setFormData({...formData, availableQuantity: e.target.value})}
                          placeholder="0"
                          className={`text-base bg-background text-foreground border-border focus:border-primary ${errors.availableQuantity ? 'border-red-500' : ''}`}
                        />
                        {errors.availableQuantity && <p className="text-red-500 text-sm mt-1">{errors.availableQuantity}</p>}
                      </div>
                      <div>
                        <Label htmlFor="price" className="mb-2 block">Precio (opcional)</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="100"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          placeholder="0"
                          className={`text-base bg-background text-foreground border-border focus:border-primary ${errors.price ? 'border-red-500' : ''}`}
                        />
                        {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category" className="mb-2 block">Categoría *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger className={`text-base bg-background text-foreground border-border focus:border-primary ${errors.category ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                    </div>
                    <div>
                      <Label htmlFor="event" className="mb-2 block">Feria *</Label>
                      <Select value={formData.eventId} onValueChange={(value) => setFormData({...formData, eventId: value})}>
                        <SelectTrigger className={`text-base bg-background text-foreground border-border focus:border-primary ${errors.eventId ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Seleccionar feria" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map((event) => (
                            <SelectItem key={event.id} value={event.id.toString()}>
                              {event.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.eventId && <p className="text-red-500 text-sm mt-1">{errors.eventId}</p>}
                    </div>
                    <div>
                      <Label htmlFor="artisan" className="mb-2 block">Artesana *</Label>
                      <Select value={formData.artisanId} onValueChange={(value) => setFormData({...formData, artisanId: value})}>
                        <SelectTrigger className={`text-base bg-background text-foreground border-border focus:border-primary ${errors.artisanId ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Seleccionar artesana" />
                        </SelectTrigger>
                        <SelectContent>
                          {artisans.map((artisan) => (
                            <SelectItem key={artisan.id} value={artisan.id.toString()}>
                              {artisan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.artisanId && <p className="text-red-500 text-sm mt-1">{errors.artisanId}</p>}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                        {editingProduct ? 'Actualizar' : 'Registrar'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {/* Filters */}
            <Card className="bg-background border border-border">
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent className="bg-background">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventFilter" className="mb-2 block">Filtrar por Feria</Label>
                    <Select value={selectedEvent || 'all'} onValueChange={handleEventFilterChange}>
                      <SelectTrigger className="text-base bg-background text-foreground border-border focus:border-primary">
                        <SelectValue placeholder="Todas las ferias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las ferias</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="artisanFilter" className="mb-2 block">Filtrar por Artesana</Label>
                    <Select value={selectedArtisan || 'all'} onValueChange={handleArtisanFilterChange}>
                      <SelectTrigger className="text-base bg-background text-foreground border-border focus:border-primary">
                        <SelectValue placeholder="Todas las artesanas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las artesanas</SelectItem>
                        {artisans.map((artisan) => (
                          <SelectItem key={artisan.id} value={artisan.id.toString()}>
                            {artisan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Products List */}
            <div className="grid gap-4">
              {filteredProducts.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      No hay productos registrados con los filtros seleccionados
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredProducts.map((product: Product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 bg-background">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground mb-2">
                            {product.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="secondary" className="text-primary bg-primary/10">
                              {product.category}
                            </Badge>
                            <Badge variant="outline" className="text-primary bg-primary/10">
                              Cantidad: {product.availableQuantity}
                            </Badge>
                            <Badge variant="outline" className="text-primary bg-primary/10">
                              ${product.price.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Feria: {getEventName(product.eventId.toString())}</p>
                            <p>Artesana: {getArtisanName(product.artisanId.toString())}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
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
