import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { apiClient } from '@/lib/api';
import { 
  InventoryMovement, 
  CreateInventoryMovement, 
  InventoryMovementFilters,
  InventoryMovementSchema 
} from '../models/inventory-movement';

export function useInventoryMovements() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todos los movimientos con filtros opcionales
  const fetchMovements = async (filters?: InventoryMovementFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.productId) params.append('productId', filters.productId.toString());
      if (filters?.type) params.append('type', filters.type);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get(`/inventory-movements?${params.toString()}`);
      
      // Validar y transformar los datos de manera más robusta
      const validatedData = response.data.map((movement: unknown) => {
        try {
          return InventoryMovementSchema.parse(movement);
        } catch (validationError) {
          // Log warning pero continúa con los datos originales
          console.warn('Validación parcial falló para movimiento, usando datos del servidor:', validationError);
          return movement as InventoryMovement;
        }
      });
      
      setMovements(validatedData);
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al cargar los movimientos de inventario';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching inventory movements:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener un movimiento por ID
  const fetchMovement = async (id: number): Promise<InventoryMovement | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/inventory-movements/${id}`);
      return InventoryMovementSchema.parse(response.data);
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al cargar el movimiento de inventario';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching inventory movement:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo movimiento
  const createMovement = async (movementData: CreateInventoryMovement): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/inventory-movements', movementData);
      
      // Intentar validar la respuesta, pero no fallar si hay problemas menores de validación
      let newMovement: InventoryMovement;
      try {
        newMovement = InventoryMovementSchema.parse(response.data);
      } catch (validationError) {
        // Si hay errores de validación pero la respuesta del servidor es exitosa,
        // usar los datos tal como vienen del servidor
        console.warn('Validación parcial falló, usando datos del servidor:', validationError);
        newMovement = response.data as InventoryMovement;
      }
      
      setMovements(prev => [newMovement, ...prev]);
      toast.success('Movimiento de inventario registrado exitosamente');
      return true;
    } catch (err: unknown) {
      // Solo mostrar errores si realmente falló la llamada al API
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al crear el movimiento de inventario';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error creating inventory movement:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cargar movimientos al montar el componente
  useEffect(() => {
    fetchMovements();
  }, []);

  return {
    movements,
    loading,
    error,
    fetchMovements,
    fetchMovement,
    createMovement,
    refetch: () => fetchMovements(),
  };
} 