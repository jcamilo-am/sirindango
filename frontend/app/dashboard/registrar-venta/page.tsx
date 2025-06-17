"use client"
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from "@/app/dashboard/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/app/dashboard/components/sidebar";
import { SiteHeader } from "@/app/dashboard/components/site-header";

interface SaleItem {
  productId: string;
  quantitySold: number;
}

export default function RegistrarVentaPage() {
  const { 
    products, 
    events, 
    artisans, 
    addSale,
    getProductsByEvent
  } = useStore();
  
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedArtisan, setSelectedArtisan] = useState('');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);

  const availableProducts = products.filter(product => {
    if (selectedEvent && product.eventId !== selectedEvent) return false;
    if (selectedArtisan && product.artisanId !== selectedArtisan) return false;
    return true;
  });

  const handleQuantityChange = (productId: string, quantity: string) => {
    const quantityNum = parseInt(quantity) || 0;
    
    setSaleItems(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        if (quantityNum === 0) {
          return prev.filter(item => item.productId !== productId);
        }
        return prev.map(item => 
          item.productId === productId 
            ? { ...item, quantitySold: quantityNum }
            : item
        );
      } else if (quantityNum > 0) {
        return [...prev, { productId, quantitySold: quantityNum }];
      }
      return prev;
    });
  };

  const getQuantityForProduct = (productId: string) => {
    const item = saleItems.find(item => item.productId === productId);
    return item ? item.quantitySold.toString() : '';
  };

  const handleRegisterSales = () => {
    if (!selectedEvent || !selectedArtisan) {
      toast.error('Por favor seleccione una feria y artesana');
      return;
    }

    if (saleItems.length === 0) {
      toast.error('Por favor agregue al menos un producto con cantidad');
      return;
    }

    // Validate quantities
    const invalidItems = saleItems.filter(item => {
      const product = products.find(p => p.id === item.productId);
      return !product || item.quantitySold > product.quantity;
    });

    if (invalidItems.length > 0) {
      toast.error('Algunas cantidades exceden el stock disponible');
      return;
    }

    // Register all sales
    saleItems.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const totalAmount = (product.price || 0) * item.quantitySold;
        addSale({
          productId: item.productId,
          artisanId: selectedArtisan,
          eventId: selectedEvent,
          quantitySold: item.quantitySold,
          totalAmount,
          date: new Date().toISOString().split('T')[0]
        });
      }
    });

    toast.success(`${saleItems.length} ventas registradas exitosamente`);
    setSaleItems([]);
  };

  const getTotalAmount = () => {
    return saleItems.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      const price = product?.price || 0;
      return total + (price * item.quantitySold);
    }, 0);
  };

  const getArtisanName = (artisanId: string) => {
    return artisans.find(a => a.id === artisanId)?.name || 'Desconocido';
  };

  const getEventName = (eventId: string) => {
    return events.find(e => e.id === eventId)?.name || 'Desconocido';
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
          <div className="space-y-6 py-4 md:py-6 px-4 lg:px-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Registro de Ventas</h2>
              <p className="text-gray-600">Registra las ventas realizadas durante las ferias</p>
            </div>
            {/* Selection Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seleccionar Feria y Artesana</CardTitle>
                <CardDescription>
                  Primero seleccione la feria y artesana para ver los productos disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventSelect" className="mb-2 block">Feria *</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Seleccionar feria" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name} - {event.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="artisanSelect" className="mb-2 block">Artesana *</Label>
                    <Select value={selectedArtisan} onValueChange={setSelectedArtisan}>
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
                </div>
              </CardContent>
            </Card>
            {/* Products for Sale */}
            {selectedEvent && selectedArtisan && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Productos Disponibles</CardTitle>
                  <CardDescription>
                    Ingrese la cantidad vendida para cada producto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No hay productos disponibles para esta combinación de feria y artesana
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableProducts.map((product) => (
                        <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1 mb-4 sm:mb-0">
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="secondary">{product.category}</Badge>
                              <Badge variant="outline">Stock: {product.quantity}</Badge>
                              {product.price && (
                                <Badge variant="outline">
                                  ${product.price.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`qty-${product.id}`} className="text-sm whitespace-nowrap">
                              Cantidad vendida:
                            </Label>
                            <Input
                              id={`qty-${product.id}`}
                              type="number"
                              min="0"
                              max={product.quantity}
                              value={getQuantityForProduct(product.id)}
                              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                              placeholder="0"
                              className="w-20 text-center"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {/* Sale Summary */}
            {saleItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de Venta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Feria:</span>
                      <span className="font-medium">{getEventName(selectedEvent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Artesana:</span>
                      <span className="font-medium">{getArtisanName(selectedArtisan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Productos:</span>
                      <span className="font-medium">{saleItems.length}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>${getTotalAmount().toLocaleString()}</span>
                    </div>
                    <Button 
                      onClick={handleRegisterSales}
                      className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
                      size="lg"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Registrar Ventas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
