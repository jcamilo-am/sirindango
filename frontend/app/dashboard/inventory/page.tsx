"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useInventoryMovements } from './hooks/useInventoryMovements';
import { useProducts } from '../products/hooks/useProducts';
import { CreateInventoryMovement, CreateInventoryMovementSchema } from './models/inventory-movement';
import { MovementType } from '@/lib/types';
import { IconPlus, IconFilter, IconRefresh, IconPackage } from '@tabler/icons-react';
import { AppSidebar } from "@/app/dashboard/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
} from "@/app/dashboard/components/sidebar";

export default function InventoryPage() {
  const { movements, loading, createMovement, fetchMovements } = useInventoryMovements();
  const { products, fetchProducts } = useProducts();
  
  // Estados del formulario
  const [formData, setFormData] = useState<CreateInventoryMovement>({
    type: MovementType.ENTRADA,
    quantity: 1,
    reason: '',
    productId: products.length > 0 ? products[0].id : 0,
  });
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    productId: 'all',
    type: 'all',
    startDate: '',
    endDate: '',
  });
  
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showTooltip, setShowTooltip] = useState<{show: boolean, content: string, x: number, y: number}>({
    show: false,
    content: '',
    x: 0,
    y: 0
  });

  // Cargar productos al montar
  useEffect(() => {
    fetchProducts();
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof CreateInventoryMovement, value: string | number | MovementType) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo al cambiar
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    try {
      CreateInventoryMovementSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error: unknown) {
      const errors: Record<string, string> = {};
      
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ path?: string[]; message: string }> };
        zodError.errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            errors[err.path[0]] = err.message;
          }
        });
      }
      
      setFormErrors(errors);
      return false;
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    // Permitir todos los movimientos de inventario sin validación de estado de evento

    const success = await createMovement(formData);
    if (success) {
      setFormData({
        type: MovementType.ENTRADA,
        quantity: 1,
        reason: '',
        productId: products.length > 0 ? products[0].id : 0,
      });
      setShowForm(false);
    }
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    const filterParams = {
      productId: filters.productId !== 'all' ? Number(filters.productId) : undefined,
      type: filters.type !== 'all' ? (filters.type as MovementType) : undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    };
    
    fetchMovements(filterParams);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilters({
      productId: 'all',
      type: 'all',
      startDate: '',
      endDate: '',
    });
        fetchMovements();
  };

  // Función para manejar doble clic en cualquier celda
  const handleCellDoubleClick = (event: React.MouseEvent, content: string) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setShowTooltip({
      show: true,
      content: content,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  // Función para cerrar el tooltip
  const handleCloseTooltip = () => {
    setShowTooltip({
      show: false,
      content: '',
      x: 0,
      y: 0
    });
  };

  // Efecto para cerrar tooltip al hacer clic fuera
  React.useEffect(() => {
    if (showTooltip.show) {
      const handleClickOutside = () => {
        handleCloseTooltip();
      };
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showTooltip.show]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="p-6 space-y-6 bg-white min-h-screen text-black">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
          <p className="text-gray-600 mt-1">Registra y consulta movimientos de inventario</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex bg-green-600 text-white hover:bg-green-700 items-center gap-2"
        >
          <IconPlus className="h-4 w-4" />
          Nuevo Movimiento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="filter-product" className="mb-2">Producto</Label>
              <Select 
                value={filters.productId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, productId: value }))}
              >
                <SelectTrigger className="truncate max-w-full overflow-hidden">
                  <SelectValue placeholder="Seleccionar producto" className="truncate max-w-full overflow-hidden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  {products
                    .filter((product) => {
                      // Filtrar productos de eventos cerrados
                      if (!product.event) return true; // Si no tiene evento, mostrar como fallback
                      
                      // Si el evento tiene estado CLOSED, no mostrar
                      if (product.event.state === 'CLOSED' || product.event.status === 'CLOSED') {
                        return false;
                      }
                      
                      // Mostrar productos de eventos SCHEDULED y ACTIVE
                      return true;
                    })
                    .map((product) => {
                    return (
                      <SelectItem 
                        key={product.id} 
                        value={product.id.toString()}
                      >
                      {product.name} - {product.artisan?.name || 'Sin artesano'}
                      {product.event?.name && ` (${product.event.name})`}
                    </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-type" className="mb-2">Tipo</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="truncate max-w-full overflow-hidden">
                  <SelectValue placeholder="Tipo de movimiento" className="truncate max-w-full overflow-hidden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="SALIDA">Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-start-date" className="mb-2">Fecha inicial</Label>
              <Input
                id="filter-start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="filter-end-date" className="mb-2">Fecha final</Label>
              <Input
                id="filter-end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters} variant="outline">
              <IconFilter className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
            <Button onClick={handleClearFilters} variant="ghost">
              <IconRefresh className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de movimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPackage className="h-5 w-5" />
            Movimientos de Inventario ({movements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando movimientos...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8">
              <IconPackage className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No se encontraron movimientos de inventario</p>
            </div>
          ) : (
            <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <Table>
                  <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                  <TableRow>
                      <TableHead className="font-semibold w-28 bg-gray-50">Fecha</TableHead>
                      <TableHead className="font-semibold w-24 bg-gray-50">Tipo</TableHead>
                      <TableHead className="font-semibold w-32 bg-gray-50">Producto</TableHead>
                      <TableHead className="font-semibold w-32 bg-gray-50">Artesano</TableHead>
                      <TableHead className="font-semibold w-32 bg-gray-50">Evento</TableHead>
                      <TableHead className="font-semibold w-20 bg-gray-50">Cantidad</TableHead>
                      <TableHead className="font-semibold w-36 bg-gray-50">Razón</TableHead>
                  </TableRow>
                </TableHeader>
                </Table>
              </div>
              <div className="overflow-auto max-h-96">
                <Table>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id} className="hover:bg-gray-50">
                      <TableCell className="w-28 max-w-28">
                        <div 
                          className="truncate cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors" 
                          title="Doble clic para ver completo"
                          onDoubleClick={(e) => handleCellDoubleClick(e, new Date(movement.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }))}
                        >
                          {new Date(movement.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="w-24 max-w-24">
                        {movement.type === MovementType.ENTRADA ? (
                          <Badge className="bg-green-600 text-white">{movement.type}</Badge>
                        ) : (
                          <Badge variant="destructive">{movement.type}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="w-32 max-w-32">
                        <div 
                          className="truncate cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors" 
                          title="Doble clic para ver completo"
                          onDoubleClick={(e) => handleCellDoubleClick(e, movement.product?.name || 'Producto no encontrado')}
                        >
                          {movement.product?.name || 'Producto no encontrado'}
                        </div>
                      </TableCell>
                      <TableCell className="w-32 max-w-32">
                        <div 
                          className="truncate cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors" 
                          title="Doble clic para ver completo"
                          onDoubleClick={(e) => handleCellDoubleClick(e, movement.product?.artisan?.name || (movement.product ? 'Sin artesano asignado' : 'Producto no encontrado'))}
                        >
                          {movement.product?.artisan?.name || (movement.product ? 'Sin artesano asignado' : 'Producto no encontrado')}
                        </div>
                      </TableCell>
                      <TableCell className="w-32 max-w-32">
                        <div 
                          className="truncate cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors" 
                          title="Doble clic para ver completo"
                          onDoubleClick={(e) => handleCellDoubleClick(e, movement.product?.event?.name || 'Sin evento asignado')}
                        >
                          {movement.product?.event?.name || 'Sin evento asignado'}
                        </div>
                      </TableCell>
                      <TableCell className="w-20 max-w-20">
                        <div 
                          className="truncate cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors" 
                          title="Doble clic para ver completo"
                          onDoubleClick={(e) => handleCellDoubleClick(e, movement.quantity.toString())}
                        >
                          {movement.quantity}
                        </div>
                      </TableCell>
                      <TableCell className="w-36 max-w-36">
                        <div 
                          className="truncate cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors" 
                          title="Doble clic para ver completo"
                          onDoubleClick={(e) => handleCellDoubleClick(e, movement.reason || 'Sin razón especificada')}
                        >
                          {movement.reason || 'Sin razón especificada'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de formulario */}
      <AlertDialog open={showForm} onOpenChange={setShowForm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar Movimiento de Inventario</AlertDialogTitle>
            <AlertDialogDescription>
              Completa la información del movimiento de inventario
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="movement-type" className="mb-2">Tipo de Movimiento <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: MovementType) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MovementType.ENTRADA}>Entrada</SelectItem>
                  <SelectItem value={MovementType.SALIDA}>Salida</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.type && <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>}
            </div>

            <div>
              <Label htmlFor="movement-product" className="mb-2">Producto <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.productId > 0 ? formData.productId.toString() : undefined} 
                onValueChange={(value) => handleInputChange('productId', Number(value))}
              >
                <SelectTrigger className='truncate max-w-80 overflow-hidden'>
                  <SelectValue placeholder="Seleccionar producto" className="truncate max-w-60 overflow-hidden" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    .filter((product) => {
                      // Filtrar productos de eventos cerrados
                      if (!product.event) return true; // Si no tiene evento, mostrar como fallback
                      
                      // Si el evento tiene estado CLOSED, no mostrar
                      if (product.event.state === 'CLOSED' || product.event.status === 'CLOSED') {
                        return false;
                      }
                      
                      // Mostrar productos de eventos SCHEDULED y ACTIVE
                      return true;
                    })
                    .map((product) => {
                    return (
                      <SelectItem 
                        key={product.id} 
                        value={product.id.toString()}
                      >
                        {product.name} - {product.artisan?.name || 'Sin artesano'}
                        {product.event?.name && ` (${product.event.name})`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {formErrors.productId && <p className="text-red-500 text-sm mt-1">{formErrors.productId}</p>}
            </div>

            <div>
              <Label htmlFor="movement-quantity" className="mb-2">Cantidad <span className="text-red-500">*</span></Label>
              <Input
                id="movement-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                placeholder="Ingresa la cantidad"
              />
              {formErrors.quantity && <p className="text-red-500 text-sm mt-1">{formErrors.quantity}</p>}
            </div>

            <div>
              <Label htmlFor="movement-reason" className="mb-2">Razón (Opcional)</Label>
              <Input
                id="movement-reason"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder="Motivo del movimiento"
              />
              {formErrors.reason && <p className="text-red-500 text-sm mt-1">{formErrors.reason}</p>}
            </div>

            <AlertDialogFooter>
              <Button 
                type="button" 
                variant="default" 
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 text-white hover:bg-green-900" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Movimiento'}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </SidebarInset>
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop 
        closeOnClick 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
      />

      {/* Tooltip del evento */}
      {showTooltip.show && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 max-w-xs break-words"
          style={{
            left: `${showTooltip.x}px`,
            top: `${showTooltip.y}px`,
            transform: 'translateX(-50%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm font-medium">
            {showTooltip.content}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </SidebarProvider>
  );
}
