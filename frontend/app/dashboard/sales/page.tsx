"use client"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ShoppingCart, CheckCircle, CreditCard, Banknote } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from "@/app/dashboard/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/app/dashboard/components/sidebar";
import { useSales } from './hooks/useSales';
import { useProducts } from '../products/hooks/useProducts';
import { useArtisans } from '../artisans/hooks/useArtisans';
import { useEvents } from '../events/hooks/useEvents';
import { CreateMultiSaleSchema, CreateMultiSaleItem } from './models/sale';
import { Artisan } from '../artisans/models/artisan';

interface SaleItem extends CreateMultiSaleItem {
  productName?: string;
  productPrice?: number;
  calculatedValue?: number;
}

export default function RegistrarVentaPage() {
  // Hooks centralizados
  const { products, fetchProducts } = useProducts();
  const { events, fetchEvents } = useEvents();
  const { artisans, fetchArtisans } = useArtisans();
  const { createMultiSale } = useSales();

  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedArtisan, setSelectedArtisan] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [cardFeeTotal, setCardFeeTotal] = useState<number>(0);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProducts();
    fetchEvents();
    fetchArtisans();
    // eslint-disable-next-line
  }, []);

  // Filtrar eventos que permitan ventas (solo ACTIVE)
  const availableEvents = events.filter(event => event.status === 'ACTIVE');

  const availableProducts = products.filter(product => {
    if (selectedEvent && product.eventId.toString() !== selectedEvent) return false;
    if (selectedArtisan && selectedArtisan !== 'all' && product.artisanId.toString() !== selectedArtisan) return false;
    return (product.stock || 0) > 0; // Solo productos con stock
  });

  const handleQuantityChange = (productId: string, quantity: string) => {
    const quantityNum = parseInt(quantity) || 0;
    const product = products.find(p => p.id.toString() === productId);
    
    setSaleItems(prev => {
      const existing = prev.find(item => item.productId.toString() === productId);
      
      if (existing) {
        if (quantityNum === 0) {
          return prev.filter(item => item.productId.toString() !== productId);
        }
        return prev.map(item =>
          item.productId.toString() === productId
            ? { 
                ...item, 
                quantitySold: quantityNum,
                calculatedValue: (product?.price || 0) * quantityNum
              }
            : item
        );
      } else if (quantityNum > 0 && product) {
        return [...prev, { 
          productId: product.id,
          artisanId: product.artisanId,
          quantitySold: quantityNum,
          productName: product.name,
          productPrice: product.price,
          calculatedValue: product.price * quantityNum
        }];
      }
      return prev;
    });
  };

  const getQuantityForProduct = (productId: string) => {
    const item = saleItems.find(item => item.productId.toString() === productId);
    return item ? item.quantitySold.toString() : '';
  };

  const handleRegisterSales = async () => {
    if (!selectedEvent) {
      toast.error('Por favor seleccione un evento');
      return;
    }
    if (saleItems.length === 0) {
      toast.error('Por favor agregue al menos un producto con cantidad');
      return;
    }

    // Validar fee de tarjeta
    if (paymentMethod === 'CARD' && cardFeeTotal < 0) {
      toast.error('El fee de tarjeta no puede ser negativo');
      return;
    }

    setErrors({});

    const multiSaleData = {
      eventId: Number(selectedEvent),
      paymentMethod,
      cardFeeTotal: paymentMethod === 'CARD' ? cardFeeTotal : 0,
      items: saleItems.map(item => ({
        productId: item.productId,
        artisanId: item.artisanId,
        quantitySold: item.quantitySold
      }))
    };

    // Validar datos antes de enviar
    const result = CreateMultiSaleSchema.safeParse(multiSaleData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      toast.error('Por favor corrija los errores en el formulario');
      return;
    }

    try {
      const results = await createMultiSale(multiSaleData);
      toast.success(`${results.length} ventas registradas exitosamente`);
      
      // Limpiar formulario
      setSaleItems([]);
      setCardFeeTotal(0);
      setPaymentMethod('CASH');
      
      // Recargar productos para actualizar stock
      fetchProducts();
    } catch (err: unknown) {
      console.error('Error creating sales:', err);
      toast.error(err instanceof Error ? err.message : 'Error al registrar ventas');
    }
  };

  const getTotalAmount = () => {
    return saleItems.reduce((total, item) => total + (item.calculatedValue || 0), 0);
  };

  const getNetAmount = () => {
    const total = getTotalAmount();
    return paymentMethod === 'CARD' ? total - cardFeeTotal : total;
  };

  const getEventName = (eventId: string) => {
    return events.find(e => e.id.toString() === eventId)?.name || 'Desconocido';
  };

  const getEventDisplayText = (event: { name: string; location: string }) => {
    const fullText = `${event.name} - ${event.location}`;
    // Truncar si es muy largo (más de 50 caracteres)
    return fullText.length > 50 ? `${fullText.substring(0, 47)}...` : fullText;
  };

  const resetForm = () => {
    setSaleItems([]);
    setSelectedEvent('');
    setSelectedArtisan('');
    setPaymentMethod('CASH');
    setCardFeeTotal(0);
    setErrors({});
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
          <div className="space-y-6 py-4 md:py-6 px-4 lg:px-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Registro de Ventas</h2>
                <p className="text-gray-600">Registra las ventas realizadas durante las ferias</p>
              </div>
              <Button 
                onClick={resetForm}
                variant="default"
                className="text-gray-900 border-2 border-yellow-500 bg-transparent hover:bg-yellow-500 hover:text-white"
              >
                Limpiar Formulario
              </Button>
            </div>

            {/* Selection Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seleccionar Evento y Filtros</CardTitle>
                <CardDescription>
                  Seleccione el evento activo y opcionalmente filtre por artesano
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventSelect" className="mb-2 block truncate max-w-40 overflow-hidden">Evento *</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger className="text-base truncate max-w-80 overflow-hidden">
                        <SelectValue placeholder="Seleccionar evento activo" className="truncate max-w-40 overflow-hidden" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEvents.map((event) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate flex-1 mr-2" title={`${event.name} - ${event.location}`}>
                                {getEventDisplayText(event)}
                              </span>
                              <Badge className="bg-green-600 text-white text-xs flex-shrink-0">Activo</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.eventId && (
                      <p className="text-red-500 text-sm mt-1">{errors.eventId}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="artisanSelect" className="mb-2 block">Artesano (Filtro opcional)</Label>
                    <Select value={selectedArtisan} onValueChange={setSelectedArtisan}>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Todos los artesanos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los artesanos</SelectItem>
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

            {/* Payment Method */}
            {selectedEvent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Método de Pago</CardTitle>
                  <CardDescription>
                    Seleccione el método de pago para todas las ventas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={(value: 'CASH' | 'CARD') => setPaymentMethod(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CASH" id="cash" />
                      <Label htmlFor="cash" className="flex items-center cursor-pointer">
                        <Banknote className="h-4 w-4 mr-2" />
                        Efectivo
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CARD" id="card" />
                      <Label htmlFor="card" className="flex items-center cursor-pointer">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Tarjeta
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {paymentMethod === 'CARD' && (
                    <div className="mt-4">
                      <Label htmlFor="cardFee" className="mb-2 block">Fee del Datáfono (Total)</Label>
                      <Input
                        id="cardFee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={cardFeeTotal}
                        onChange={(e) => setCardFeeTotal(Number(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Se prorrateará automáticamente entre todas las ventas
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Products for Sale */}
            {selectedEvent && (
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
                        No hay productos disponibles con stock para esta combinación
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableProducts.map((product) => {
                        const maxQuantity = product.stock || 0;
                        const currentQuantity = parseInt(getQuantityForProduct(product.id.toString())) || 0;
                        
                        return (
                          <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex-1 mb-4 sm:mb-0">
                              <h4 className="font-medium text-gray-900">{product.name}</h4>
                              <p className="text-sm text-gray-600">Artesano: {product.artisan?.name || 'Sin artesano'}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary">{product.category}</Badge>
                                <Badge variant="outline" className={maxQuantity <= 5 ? 'border-red-500 text-red-600' : ''}>
                                  Stock: {maxQuantity}
                                </Badge>
                                <Badge variant="outline">
                                  ${product.price?.toLocaleString()}
                                </Badge>
                                {currentQuantity > 0 && (
                                  <Badge className="bg-green-600 text-white">
                                    Total: ${((product.price || 0) * currentQuantity).toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`qty-${product.id}`} className="text-sm whitespace-nowrap">
                                Cantidad:
                              </Label>
                              <Input
                                id={`qty-${product.id}`}
                                type="number"
                                min="0"
                                max={maxQuantity}
                                value={getQuantityForProduct(product.id.toString())}
                                onChange={(e) => handleQuantityChange(product.id.toString(), e.target.value)}
                                placeholder="0"
                                className="w-20 text-center"
                              />
                            </div>
                          </div>
                        );
                      })}
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
                      <span>Evento:</span>
                      <span className="font-medium">{getEventName(selectedEvent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Productos:</span>
                      <span className="font-medium">{saleItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Método de pago:</span>
                      <div className="flex items-center">
                        {paymentMethod === 'CASH' ? (
                          <><Banknote className="h-4 w-4 mr-1" /> Efectivo</>
                        ) : (
                          <><CreditCard className="h-4 w-4 mr-1" /> Tarjeta</>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span>Subtotal:</span>
                      <span>${getTotalAmount().toLocaleString()}</span>
                    </div>
                    {paymentMethod === 'CARD' && cardFeeTotal > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Fee datáfono:</span>
                        <span>-${cardFeeTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total neto:</span>
                      <span>${getNetAmount().toLocaleString()}</span>
                    </div>
                    <Button 
                      onClick={handleRegisterSales}
                      className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
                      size="lg"
                      disabled={saleItems.length === 0}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Registrar {saleItems.length} Venta{saleItems.length !== 1 ? 's' : ''}
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
