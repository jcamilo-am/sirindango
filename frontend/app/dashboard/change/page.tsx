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
import { 
  ArrowRightLeft, 
  CheckCircle, 
  CreditCard, 
  Banknote, 
  Package, 
  Calculator,
  Search
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from "@/app/dashboard/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/app/dashboard/components/sidebar";
import { useProductChanges } from './hooks/useProductChanges';
import { useSales } from '../sales/hooks/useSales';
import { useProducts } from '../products/hooks/useProducts';
import { useEvents } from '../events/hooks/useEvents';
import { CreateProductChange, validateChangeRequest, calculateChangeValues } from './models/product-change';

interface ChangeFormData {
  saleId: string;
  productReturnedId: string;
  productDeliveredId: string;
  quantity: number;
  paymentMethodDifference?: 'CASH' | 'CARD';
  cardFeeDifference?: number;
}

export default function CambiosProductosPage() {
  // Hooks
  const { productChanges, loading, createProductChange, fetchProductChanges } = useProductChanges();
  const { sales, fetchSales } = useSales();
  const { products, fetchProducts } = useProducts();
  const { events, fetchEvents } = useEvents();

  // Estado del formulario
  const [formData, setFormData] = useState<ChangeFormData>({
    saleId: '',
    productReturnedId: '',
    productDeliveredId: '',
    quantity: 1,
    paymentMethodDifference: 'CASH',
    cardFeeDifference: 0,
  });


  const [calculatedValues, setCalculatedValues] = useState({
    originalValue: 0,
    newValue: 0,
    valueDifference: 0,
    netAmount: 0,
  });

  // Filtros para búsqueda
  const [searchFilters, setSearchFilters] = useState({
    eventId: 'all',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchEvents();
    fetchProductChanges();
    // eslint-disable-next-line
  }, []);

  // Filtrar ventas que permiten cambios (solo ACTIVE)
  const availableSales = sales.filter(sale => 
    sale.state === 'ACTIVE' && 
    !productChanges.some(change => change.saleId === sale.id)
  );

  // Obtener venta seleccionada
  const selectedSale = sales.find(sale => sale.id.toString() === formData.saleId);

  // Productos del mismo evento y artesano que la venta seleccionada
  const availableProducts = selectedSale 
    ? products.filter(product => 
        product.eventId === selectedSale.eventId && 
        product.artisanId === selectedSale.artisanId
      )
    : [];

  // Producto devuelto seleccionado
  const returnedProduct = availableProducts.find(p => p.id.toString() === formData.productReturnedId);
  
  // Productos disponibles para entrega (deben tener stock y precio >= al devuelto)
  const deliveryProducts = availableProducts.filter(product => {
    if (!returnedProduct) return false;
    return (product.stock || 0) >= formData.quantity && 
           product.price >= returnedProduct.price;
  });

  // Calcular valores cuando cambian los datos del formulario
  useEffect(() => {
    if (returnedProduct && formData.productDeliveredId && formData.quantity > 0) {
      const deliveredProduct = products.find(p => p.id.toString() === formData.productDeliveredId);
      if (deliveredProduct) {
        const originalValue = returnedProduct.price * formData.quantity;
        const newValue = deliveredProduct.price * formData.quantity;
        const valueDifference = newValue - originalValue;
        const netAmount = valueDifference - (formData.cardFeeDifference || 0);

        setCalculatedValues({
          originalValue,
          newValue,
          valueDifference,
          netAmount,
        });
      }
    } else {
      setCalculatedValues({
        originalValue: 0,
        newValue: 0,
        valueDifference: 0,
        netAmount: 0,
      });
    }
  }, [formData, returnedProduct, products]);

  const handleSubmit = async () => {
    if (!formData.saleId || !formData.productReturnedId || !formData.productDeliveredId) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    if (!selectedSale || !returnedProduct) {
      toast.error('Datos de venta o producto no válidos');
      return;
    }

    // Validaciones
    const deliveredProduct = products.find(p => p.id.toString() === formData.productDeliveredId);
    if (!deliveredProduct) {
      toast.error('Producto de entrega no válido');
      return;
    }

    const validation = validateChangeRequest(
      selectedSale.quantitySold,
      formData.quantity,
      returnedProduct.price,
      deliveredProduct.price
    );

    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    const changeData: CreateProductChange = {
      saleId: Number(formData.saleId),
      productReturnedId: Number(formData.productReturnedId),
      productDeliveredId: Number(formData.productDeliveredId),
      quantity: formData.quantity,
      paymentMethodDifference: calculatedValues.valueDifference > 0 
        ? formData.paymentMethodDifference 
        : undefined,
      cardFeeDifference: formData.paymentMethodDifference === 'CARD' && calculatedValues.valueDifference > 0
        ? formData.cardFeeDifference 
        : undefined,
    };

    try {
      const result = await createProductChange(changeData);
      toast.success(result.message || 'Cambio registrado exitosamente');
      
      // Limpiar formulario
      setFormData({
        saleId: '',
        productReturnedId: '',
        productDeliveredId: '',
        quantity: 1,
        paymentMethodDifference: 'CASH',
        cardFeeDifference: 0,
      });
      
      // Recargar datos
      fetchSales();
      fetchProducts();
    } catch (err: unknown) {
      console.error('Error creating product change:', err);
      toast.error(err instanceof Error ? err.message : 'Error al registrar cambio');
    }
  };

  const resetForm = () => {
    setFormData({
      saleId: '',
      productReturnedId: '',
      productDeliveredId: '',
      quantity: 1,
      paymentMethodDifference: 'CASH',
      cardFeeDifference: 0,
    });
  };

  const filteredChanges = productChanges.filter(change => {
    // Buscar la venta asociada al cambio para obtener el eventId
    const associatedSale = sales.find(sale => sale.id === change.saleId);
    if (searchFilters.eventId && searchFilters.eventId !== 'all' && associatedSale?.eventId?.toString() !== searchFilters.eventId) return false;
    if (searchFilters.startDate) {
      const changeDate = new Date(change.createdAt);
      const startDate = new Date(searchFilters.startDate);
      if (changeDate < startDate) return false;
    }
    if (searchFilters.endDate) {
      const changeDate = new Date(change.createdAt);
      const endDate = new Date(searchFilters.endDate);
      if (changeDate > endDate) return false;
    }
    return true;
  });

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
                <h2 className="text-2xl font-bold text-gray-900">Cambios de Productos</h2>
                <p className="text-gray-600">Registra y gestiona los cambios de productos realizados durante las ferias</p>
              </div>
              <Button 
                onClick={resetForm}
                variant="default"
                className="text-gray-900 border-2 border-yellow-500 bg-transparent hover:bg-yellow-500 hover:text-white"
              >
                Limpiar Formulario
              </Button>
            </div>

            {/* Formulario de Cambio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Registrar Cambio de Producto
                </CardTitle>
                <CardDescription>
                  Seleccione la venta y los productos para realizar el cambio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Selección de Venta */}
                  <div className="md:col-span-2">
                    <Label htmlFor="saleSelect" className="mb-2 block">Venta Elegible <span className="text-red-500">*</span></Label>
                    <Select value={formData.saleId} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, saleId: value, productReturnedId: '', productDeliveredId: '' }))
                    }>
                      <SelectTrigger className="text-base mt-2">
                        <SelectValue placeholder="Seleccionar venta que permite cambio" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSales.map((sale) => (
                          <SelectItem key={sale.id} value={sale.id.toString()}>
                            Venta #{sale.id} - {sale.quantitySold} unidades - ${sale.valueCharged.toLocaleString()}
                            <Badge className="ml-2 bg-blue-600 text-white text-xs">
                              {new Date(sale.date).toLocaleDateString()}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Producto a Devolver */}
                  {selectedSale && (
                    <div>
                      <Label htmlFor="returnedProduct" className="mb-2 block">Producto a Devolver <span className="text-red-500">*</span></Label>
                      <Select value={formData.productReturnedId} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, productReturnedId: value, productDeliveredId: '' }))
                      }>
                        <SelectTrigger className="text-base mt-2 overflow-hidden truncate max-w-90">
                          <SelectValue placeholder="Seleccionar producto devuelto" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - ${product.price.toLocaleString()}
                              <Badge variant="outline" className="ml-2">{product.category}</Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Producto a Entregar */}
                  {returnedProduct && (
                    <div>
                      <Label htmlFor="deliveredProduct" className="mb-2 block">Producto a Entregar <span className="text-red-500">*</span></Label>
                      <Select value={formData.productDeliveredId} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, productDeliveredId: value }))
                      }>
                        <SelectTrigger className="text-base mt-2 overflow-hidden truncate max-w-90">
                          <SelectValue placeholder="Seleccionar producto a entregar" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - ${product.price.toLocaleString()}
                              <Badge variant="outline" className="ml-2">Stock: {product.stock}</Badge>
                              {product.price > returnedProduct.price ? (
                                <Badge className="ml-2 bg-green-600 text-white text-xs">
                                  +${(product.price - returnedProduct.price).toLocaleString()}
                                </Badge>
                              ) : product.price === returnedProduct.price ? (
                                <Badge className="ml-2 bg-blue-600 text-white text-xs">
                                  Sin costo
                                </Badge>
                              ) : null}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Cantidad */}
                  {formData.productReturnedId && (
                    <div>
                      <Label htmlFor="quantity" className="mb-2 block">Cantidad a Cambiar <span className="text-red-500">*</span></Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={selectedSale?.quantitySold || 1}
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          quantity: parseInt(e.target.value) || 1 
                        }))}
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Máximo: {selectedSale?.quantitySold} unidades
                      </p>
                    </div>
                  )}

                  {/* Método de Pago del Excedente */}
                  {calculatedValues.valueDifference > 0 && (
                    <div>
                      <Label className="mb-2 block">Método de Pago del Excedente</Label>
                      <RadioGroup 
                        value={formData.paymentMethodDifference} 
                        onValueChange={(value: 'CASH' | 'CARD') => 
                          setFormData(prev => ({ ...prev, paymentMethodDifference: value }))
                        }
                      >
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
                    </div>
                  )}

                  {/* Fee de Tarjeta */}
                  {formData.paymentMethodDifference === 'CARD' && calculatedValues.valueDifference > 0 && (
                    <div>
                      <Label htmlFor="cardFee" className="mb-2 block">Fee del Datáfono</Label>
                      <Input
                        id="cardFee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.cardFeeDifference || 0}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          cardFeeDifference: Number(e.target.value) || 0 
                        }))}
                        placeholder="0.00"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resumen de Cálculos */}
            {calculatedValues.valueDifference >= 0 && formData.productDeliveredId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Resumen del Cambio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Valor producto devuelto:</span>
                      <span>${calculatedValues.originalValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor producto entregado:</span>
                      <span>${calculatedValues.newValue.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-medium">
                      <span>
                        {calculatedValues.valueDifference === 0 ? 'Cambio sin costo adicional' : 'Excedente a cobrar'}:
                      </span>
                      <span className={calculatedValues.valueDifference === 0 ? 'text-blue-600' : ''}>
                        ${calculatedValues.valueDifference.toLocaleString()}
                      </span>
                    </div>
                    {formData.paymentMethodDifference === 'CARD' && formData.cardFeeDifference && formData.cardFeeDifference > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Fee datáfono:</span>
                        <span>-${formData.cardFeeDifference.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-green-600">
                      <span>Ganancia neta para artesano:</span>
                      <span>${calculatedValues.netAmount.toLocaleString()}</span>
                    </div>
                    <Button 
                      onClick={handleSubmit}
                      className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
                      size="lg"
                      disabled={loading || !formData.productDeliveredId}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      {calculatedValues.valueDifference === 0 ? 'Registrar Cambio Sin Costo' : 'Registrar Cambio'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historial de Cambios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Historial de Cambios
                </CardTitle>
                <CardDescription>
                  Cambios de productos registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtros de búsqueda */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label htmlFor="eventFilter">Filtrar por Evento</Label>
                    <Select value={searchFilters.eventId} onValueChange={(value) => 
                      setSearchFilters(prev => ({ ...prev, eventId: value }))
                    }>
                      <SelectTrigger className="mt-2 overflow-hidden truncate max-w-60">
                        <SelectValue placeholder="Todos los eventos" className='overflow-hidden truncate max-w-60'/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los eventos</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="startDate" className="mb-2">Fecha Inicio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={searchFilters.startDate}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="mb-2">Fecha Fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={searchFilters.endDate}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                {filteredChanges.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay cambios registrados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredChanges.map((change) => {
                      const calculated = calculateChangeValues(change);
                      return (
                        <div key={change.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">Cambio #{change.id}</h4>
                              <p className="text-sm text-gray-600">
                                Venta #{change.saleId} - {new Date(change.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={change.valueDifference === 0 ? "bg-green-600 text-white" : "bg-blue-600 text-white"}>
                              {change.valueDifference === 0 ? 'Sin costo' : `$${change.valueDifference.toLocaleString()}`}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Producto devuelto:</strong> {change.returnedProduct?.name}</p>
                              <p><strong>Producto entregado:</strong> {change.deliveredProduct?.name}</p>
                              <p><strong>Cantidad:</strong> {change.quantity} unidades</p>
                            </div>
                            <div>
                              <p><strong>Valor original:</strong> ${calculated.originalValue.toLocaleString()}</p>
                              <p><strong>Valor nuevo:</strong> ${calculated.newValue.toLocaleString()}</p>
                              <p><strong>Ganancia neta:</strong> ${calculated.netGainForArtisan.toLocaleString()}</p>
                            </div>
                          </div>
                          {change.valueDifference === 0 ? (
                            <div className="mt-2 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-xs text-green-600 font-medium">
                                Cambio realizado sin costo adicional
                              </span>
                            </div>
                          ) : change.paymentMethodDifference && (
                            <div className="mt-2 flex items-center gap-2">
                              {change.paymentMethodDifference === 'CASH' ? (
                                <Banknote className="h-4 w-4" />
                              ) : (
                                <CreditCard className="h-4 w-4" />
                              )}
                              <span className="text-xs">
                                Excedente pagado en {change.paymentMethodDifference === 'CASH' ? 'efectivo' : 'tarjeta'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
