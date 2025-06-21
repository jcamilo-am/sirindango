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
import { Plus, Edit2, Trash2, Package, Filter, AlertTriangle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AppSidebar } from "@/app/dashboard/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/app/dashboard/components/sidebar";
import { useProducts } from './hooks/useProducts';
import { CreateProductSchema, Product, CreateProduct, UpdateProduct } from './models/product';
import { useEvents } from '../events/hooks/useEvents';
import { useArtisans } from '../artisans/hooks/useArtisans';

export default function RegistrarProductoPage() {
  const {
    products,
    fetchProducts,
    createProduct,
    editProduct,
    deleteProduct,
    getProductsWithLowStock,
    getUniqueCategories,
  } = useProducts();



  const { events, fetchEvents } = useEvents();
  const { 
    artisans, 
    fetchArtisans, 
    getActiveArtisans, 
    validateArtisan,
    getArtisanName 
  } = useArtisans();

  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedArtisan, setSelectedArtisan] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    initialQuantity: '',
    category: '',
    price: '',
    eventId: '',
    artisanId: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);


  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchProducts(),
          fetchEvents(),
          fetchArtisans()
        ]);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar datos iniciales');
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para extraer mensaje de error del backend
  const extractErrorMessage = (err: unknown): string => {
    // Verificar si es un error de axios
    if (err && typeof err === 'object') {
      const errorObj = err as Record<string, unknown>;
      
      // Caso 1: Error de axios con response
      if ('response' in errorObj && errorObj.response && typeof errorObj.response === 'object') {
        const response = errorObj.response as Record<string, unknown>;
        
        if ('data' in response && response.data && typeof response.data === 'object') {
          const data = response.data as Record<string, unknown>;
          
          // Priorizar message sobre error
          if ('message' in data && typeof data.message === 'string') {
            return data.message;
          }
          if ('error' in data && typeof data.error === 'string') {
            return data.error;
          }
        }
        
        // Si data es un string directamente
        if ('data' in response && typeof response.data === 'string') {
          return response.data;
        }
        
        // Fallback con status
        const status = 'status' in response ? response.status : 'desconocido';
        const statusText = 'statusText' in response && typeof response.statusText === 'string' 
          ? response.statusText 
          : 'Error del servidor';
        return `Error ${status}: ${statusText}`;
      }
      
      // Caso 2: Error de red sin response
      if ('request' in errorObj) {
        return 'Error de conexión con el servidor';
      }
      
      // Caso 3: Error con message
      if ('message' in errorObj && typeof errorObj.message === 'string') {
        return errorObj.message;
      }
    }
    
    // Caso 4: Error estándar de JavaScript
    if (err instanceof Error) {
      return err.message;
    }
    
    return 'Ha ocurrido un error inesperado';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const productData: CreateProduct = {
      name: formData.name,
      price: Number(formData.price),
      initialQuantity: Number(formData.initialQuantity),
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

    // Validar que el artesano esté activo
    if (!validateArtisan(productData.artisanId)) {
      setErrors({ artisanId: 'El artesano seleccionado no está activo' });
      toast.error('El artesano seleccionado no está activo');
      return;
    }

    try {
      if (editingProduct) {
        const updateData: UpdateProduct = {
          name: productData.name,
          price: productData.price,
          category: productData.category,
          eventId: productData.eventId,
          artisanId: productData.artisanId,
        };
        await editProduct(Number(editingProduct), updateData);
          toast.success('Producto actualizado exitosamente');
      } else {
        await createProduct(productData);
          toast.success('Producto registrado exitosamente');
      }
      resetForm();
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      toast.error(message);
    }
  };



  const resetForm = () => {
    setFormData({
      name: '',
      initialQuantity: '',
      category: '',
      price: '',
      eventId: '',
      artisanId: ''
    });
    setEditingProduct(null);
    setIsDialogOpen(false);
    setErrors({});
  };



  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      initialQuantity: (product.stock || 0).toString(),
      category: product.category || '',
      price: product.price.toString(),
      eventId: product.eventId.toString(),
      artisanId: product.artisanId.toString()
    });
    setEditingProduct(product.id.toString());
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    setProductToDelete(products.find(p => p.id === id) || null);
    setIsDeleteDialogOpen(true);
  };



  const filteredProducts = products.filter(product => {
    if (selectedEvent && product.eventId.toString() !== selectedEvent) return false;
    if (selectedArtisan && product.artisanId.toString() !== selectedArtisan) return false;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = showLowStock ? (product.stock || 0) <= 5 : true;
    return matchesSearch && matchesLowStock;
  });

  const getEventName = (eventId: number) => {
    return events.find(e => e.id === eventId)?.name || 'Desconocido';
  };

  const handleEventFilterChange = (value: string) => {
    setSelectedEvent(value === 'all' ? '' : value);
  };

  const handleArtisanFilterChange = (value: string) => {
    setSelectedArtisan(value === 'all' ? '' : value);
  };

  const clearAllFilters = () => {
    setSelectedEvent('');
    setSelectedArtisan('');
    setSearchTerm('');
    setShowLowStock(false);
  };

  const hasActiveFilters = selectedEvent || selectedArtisan || searchTerm || showLowStock;

  const lowStockProducts = getProductsWithLowStock();
  const categories = getUniqueCategories();

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
              <div className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                    Nuevo Producto
                  </Button>
                </DialogTrigger>
                </Dialog>
              </div>
            </div>



            {/* Diálogos */}
            {/* Diálogo Crear Producto */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                      <Label htmlFor="quantity" className="mb-2 block">Cantidad Inicial *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                        value={formData.initialQuantity}
                        onChange={(e) => setFormData({...formData, initialQuantity: e.target.value})}
                          placeholder="0"
                        className={`text-base bg-background text-foreground border-border focus:border-primary ${errors.initialQuantity ? 'border-red-500' : ''}`}
                        />
                      {errors.initialQuantity && <p className="text-red-500 text-sm mt-1">{errors.initialQuantity}</p>}
                      </div>
                      <div>
                      <Label htmlFor="price" className="mb-2 block">Precio *</Label>
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
                        <SelectTrigger className={`text-base bg-background text-foreground border-border focus:border-primary max-w-full ${errors.eventId ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Seleccionar feria">
                            <span className="truncate block">
                              {formData.eventId ? events.find(e => e.id.toString() === formData.eventId)?.name || 'Seleccionar feria' : 'Seleccionar feria'}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-w-[300px]">
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
                        <SelectTrigger className={`text-base bg-background text-foreground border-border focus:border-primary max-w-full ${errors.artisanId ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Seleccionar artesana">
                            <span className="truncate block">
                              {formData.artisanId ? getActiveArtisans().find(a => a.id.toString() === formData.artisanId)?.name || 'Seleccionar artesana' : 'Seleccionar artesana'}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-w-[300px]">
                        {getActiveArtisans().map((artisan) => (
                            <SelectItem key={artisan.id} value={artisan.id.toString()}>
                            {artisan.name} - {artisan.identification}
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

            {/* Filters */}
            <Card className="bg-background border border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
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
              <CardContent className="bg-background">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search" className="mb-2 block">Buscar por nombre</Label>
                    <Input
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar productos..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventFilter" className="mb-2 block">Filtrar por Feria</Label>
                    <Select value={selectedEvent || 'all'} onValueChange={handleEventFilterChange}>
                      <SelectTrigger className="text-base bg-background text-foreground border-border focus:border-primary max-w-full">
                        <SelectValue placeholder="Todas las ferias">
                          <span className="truncate block">
                            {selectedEvent ? events.find(e => e.id.toString() === selectedEvent)?.name || 'Todas las ferias' : 'Todas las ferias'}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-w-[300px]">
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
                      <SelectTrigger className="text-base bg-background text-foreground border-border focus:border-primary max-w-full">
                        <SelectValue placeholder="Todas las artesanas">
                          <span className="truncate block">
                            {selectedArtisan ? artisans.find(a => a.id.toString() === selectedArtisan)?.name || 'Todas las artesanas' : 'Todas las artesanas'}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-w-[300px]">
                        <SelectItem value="all">Todas las artesanas</SelectItem>
                        {artisans.map((artisan) => (
                          <SelectItem key={artisan.id} value={artisan.id.toString()}>
                            {artisan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="stockFilter" className="mb-2 block">Filtrar por stock</Label>
                    <Button
                      variant={showLowStock ? "default" : "outline"}
                      onClick={() => setShowLowStock(!showLowStock)}
                      className="w-full"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Stock bajo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
              <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                <CardContent className="ml-2">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">
                      {lowStockProducts.length} productos con stock bajo
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products List */}
            <div className="grid gap-4">
              {filteredProducts.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      {products.length === 0 
                        ? "No hay productos registrados"
                        : "No hay productos que coincidan con los filtros seleccionados"
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredProducts.map((product: Product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 bg-background">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-2xl text-foreground mb-2">
                            {product.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="secondary" className="text-primary bg-primary/10">
                              {product.category}
                            </Badge>
                            <Badge 
                              variant={
                                ((product.stock || 0) <= 3) ? "destructive" : 
                                ((product.stock || 0) > 3 && (product.stock || 0) < 7) ? "outline" : 
                                "secondary"
                              }
                              className={
                                ((product.stock || 0) <= 3) ? "" : 
                                ((product.stock || 0) > 3 && (product.stock || 0) < 7) ? "text-yellow-700 bg-yellow-100 border-yellow-300" : 
                                "text-green-700 bg-green-100 border-green-300"
                              }
                            >
                              Stock: {product.stock || 0}
                            </Badge>
                            <Badge variant="outline" className="text-primary bg-primary/10">
                              ${product.price.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Evento: {getEventName(product.eventId)}</p>
                            <p>Artesano: {getArtisanName(product.artisanId)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 border-1 border-blue-600 hover:text-white hover:bg-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDelete(product.id)}
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
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de que quieres eliminar este producto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Si el producto tiene movimientos de inventario, no podrá ser eliminado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  if (productToDelete) {
                    try {
                      await deleteProduct(productToDelete.id);
                      toast.success('Producto eliminado exitosamente');
                      setIsDeleteDialogOpen(false);
                      setProductToDelete(null);
                    } catch (err: unknown) {
                      const message = extractErrorMessage(err);
                      toast.error(message);
                      setIsDeleteDialogOpen(false);
                      setProductToDelete(null);
                    }
                  }
                }}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </SidebarProvider>
  );
}
