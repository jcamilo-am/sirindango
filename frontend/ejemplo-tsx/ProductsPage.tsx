"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ProductsPage() {
  const { 
    products, 
    events, 
    artisans, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    getProductsByEvent 
  } = useStore();
  
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedArtisan, setSelectedArtisan] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    category: '',
    price: '',
    eventId: '',
    artisanId: ''
  });

  const categories = ['Textiles', 'Cerámica', 'Joyería', 'Tallado', 'Otros'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.quantity || !formData.category || !formData.eventId || !formData.artisanId) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    const productData = {
      name: formData.name,
      quantity: parseInt(formData.quantity),
      category: formData.category,
      price: formData.price ? parseFloat(formData.price) : undefined,
      eventId: formData.eventId,
      artisanId: formData.artisanId
    };

    if (editingProduct) {
      updateProduct(editingProduct, productData);
      toast.success('Producto actualizado exitosamente');
    } else {
      addProduct(productData);
      toast.success('Producto registrado exitosamente');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: '',
      category: '',
      price: '',
      eventId: '',
      artisanId: ''
    });
    setEditingProduct(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      quantity: product.quantity.toString(),
      category: product.category,
      price: product.price?.toString() || '',
      eventId: product.eventId,
      artisanId: product.artisanId
    });
    setEditingProduct(product.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    toast.success('Producto eliminado exitosamente');
  };

  const filteredProducts = products.filter(product => {
    if (selectedEvent && product.eventId !== selectedEvent) return false;
    if (selectedArtisan && product.artisanId !== selectedArtisan) return false;
    return true;
  });

  const getArtisanName = (artisanId: string) => {
    return artisans.find(a => a.id === artisanId)?.name || 'Desconocido';
  };

  const getEventName = (eventId: string) => {
    return events.find(e => e.id === eventId)?.name || 'Desconocido';
  };

  const handleEventFilterChange = (value: string) => {
    setSelectedEvent(value === 'all' ? '' : value);
  };

  const handleArtisanFilterChange = (value: string) => {
    setSelectedArtisan(value === 'all' ? '' : value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Productos</h2>
          <p className="text-gray-600">Registra y administra los productos para las ferias</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
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
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Bolso tejido a mano"
                  className="text-base"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="0"
                    className="text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Precio (opcional)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0"
                    className="text-base"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Categoría *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger className="text-base">
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
              </div>

              <div>
                <Label htmlFor="event">Feria *</Label>
                <Select value={formData.eventId} onValueChange={(value) => setFormData({...formData, eventId: value})}>
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Seleccionar feria" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="artisan">Artesana *</Label>
                <Select value={formData.artisanId} onValueChange={(value) => setFormData({...formData, artisanId: value})}>
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Seleccionar artesana" />
                  </SelectTrigger>
                  <SelectContent>
                    {artisans.map((artisan) => (
                      <SelectItem key={artisan.id} value={artisan.id}>
                        {artisan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventFilter">Filtrar por Feria</Label>
              <Select value={selectedEvent || 'all'} onValueChange={handleEventFilterChange}>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Todas las ferias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ferias</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="artisanFilter">Filtrar por Artesana</Label>
              <Select value={selectedArtisan || 'all'} onValueChange={handleArtisanFilterChange}>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Todas las artesanas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las artesanas</SelectItem>
                  {artisans.map((artisan) => (
                    <SelectItem key={artisan.id} value={artisan.id}>
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
          filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {product.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="secondary">{product.category}</Badge>
                      <Badge variant="outline">
                        Cantidad: {product.quantity}
                      </Badge>
                      {product.price && (
                        <Badge variant="outline">
                          ${product.price.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Feria: {getEventName(product.eventId)}</p>
                      <p>Artesana: {getArtisanName(product.artisanId)}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-700"
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
  );
}