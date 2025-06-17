"use client"
import { useState, useEffect } from 'react';
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
import { getProducts, getEvents, getArtisans, createSale } from '@/lib/api';
import { CreateSaleSchema } from '@/lib/schemas';
import type { Product, Event, Artisan } from '@/lib/store';

interface SaleItem {
  productId: string;
  quantitySold: number;
}

export default function RegistrarVentaPage() {
  // Estados locales para los datos
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedArtisan, setSelectedArtisan] = useState('');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingArtisans, setLoadingArtisans] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableProducts = products.filter(product => {
    if (selectedEvent && product.eventId.toString() !== selectedEvent) return false;
    if (selectedArtisan && product.artisanId.toString() !== selectedArtisan) return false;
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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data: Product[] = await getProducts();
      setProducts(data);
    } catch (err) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const data: Event[] = await getEvents();
      setEvents(data);
    } catch (err) {
      toast.error('Error al cargar eventos');
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchArtisans = async () => {
    setLoadingArtisans(true);
    try {
      const data: Artisan[] = await getArtisans();
      setArtisans(data);
    } catch (err) {
      toast.error('Error al cargar artesanas');
    } finally {
      setLoadingArtisans(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchEvents();
    fetchArtisans();
  }, []);

  const handleRegisterSales = async () => {
    if (!selectedEvent || !selectedArtisan) {
      toast.error('Por favor seleccione una feria y artesana');
      return;
    }
    if (saleItems.length === 0) {
      toast.error('Por favor agregue al menos un producto con cantidad');
      return;
    }
    setErrors({});
    const newErrors: Record<string, string> = {};
    let hasErrors = false;
    for (const item of saleItems) {
      const saleData = {
        productId: Number(item.productId),
        artisanId: Number(selectedArtisan),
        eventId: Number(selectedEvent),
        quantitySold: item.quantitySold,
      };
      const result = CreateSaleSchema.safeParse(saleData);
      if (!result.success) {
        result.error.errors.forEach((err) => {
          newErrors[`${item.productId}-${err.path[0]}`] = err.message;
        });
        hasErrors = true;
      }
    }
    if (hasErrors) {
      setErrors(newErrors);
      toast.error('Por favor corrija los errores en el formulario');
      return;
    }
    try {
      for (const item of saleItems) {
        const product = products.find((p) => p.id.toString() === item.productId);
        if (product) {
          await createSale({
            productId: Number(item.productId),
            artisanId: Number(selectedArtisan),
            eventId: Number(selectedEvent),
            quantitySold: item.quantitySold,
            totalAmount: (product.price || 0) * item.quantitySold,
            date: new Date().toISOString().split('T')[0],
          });
        }
      }
      toast.success(`${saleItems.length} ventas registradas exitosamente`);
      setSaleItems([]);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar venta');
    }
  };

  const getTotalAmount = () => {
    return saleItems.reduce((total, item) => {
      const product = products.find(p => p.id.toString() === item.productId);
      const price = product?.price || 0;
      return total + (price * item.quantitySold);
    }, 0);
  };

  const getArtisanName = (artisanId: string) => {
    return artisans.find(a => a.id.toString() === artisanId)?.name || 'Desconocido';
  };

  const getEventName = (eventId: string) => {
    return events.find(e => e.id.toString() === eventId)?.name || 'Desconocido';
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
                        {events.map((event: Event) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
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
                        {artisans.map((artisan: Artisan) => (
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
                      {availableProducts.map((product: Product) => (
                        <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1 mb-4 sm:mb-0">
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="secondary">{product.category}</Badge>
                              <Badge variant="outline">Stock: {product.availableQuantity}</Badge>
                              <Badge variant="outline">
                                ${product.price.toLocaleString()}
                              </Badge>
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
                              max={product.availableQuantity}
                              value={getQuantityForProduct(product.id.toString())}
                              onChange={(e) => handleQuantityChange(product.id.toString(), e.target.value)}
                              placeholder="0"
                              className={`w-20 text-center ${errors[`${product.id}-quantitySold`] ? 'border-red-500' : ''}`}
                            />
                            {errors[`${product.id}-quantitySold`] && (
                              <p className="text-red-500 text-sm mt-1">{errors[`${product.id}-quantitySold`]}</p>
                            )}
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
