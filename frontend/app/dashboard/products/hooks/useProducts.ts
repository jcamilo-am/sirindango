import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { 
  ProductListSchema, 
  Product, 
  CreateProductSchema, 
  CreateProduct, 
  UpdateProduct,
  ProductFilters
} from '../models/product';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET - Obtener productos con filtros opcionales
  const fetchProducts = async (filters?: ProductFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      if (filters?.eventId) params.append('eventId', filters.eventId.toString());
      if (filters?.artisanId) params.append('artisanId', filters.artisanId.toString());
      if (filters?.order) params.append('order', filters.order);
      
      const queryString = params.toString();
      const url = queryString ? `/products?${queryString}` : '/products';
      
      const res = await apiClient.get(url);
      const data = ProductListSchema.parse(res.data);
      setProducts(data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar productos';
      setError(message);
      throw err; // Preservar el error original
    } finally {
      setLoading(false);
    }
  };

  // GET - Obtener producto por ID
  const fetchProductById = async (id: number): Promise<Product | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/products/${id}`);
      return res.data as Product;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar producto';
      setError(message);
      throw err; // Preservar el error original
    } finally {
      setLoading(false);
    }
  };

  // CREATE - Crear nuevo producto
  const createProduct = async (product: CreateProduct) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateProductSchema.parse(product);
      const res = await apiClient.post('/products', parsed);
      const newProduct = res.data as Product;
      setProducts((prev) => [...prev, newProduct]);
      return newProduct;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear producto';
      setError(message);
      throw err; // Preservar el error original
    } finally {
      setLoading(false);
    }
  };

  // EDIT - Actualizar producto
  const editProduct = async (id: number, product: UpdateProduct) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.patch(`/products/${id}`, product);
      const updatedProduct = res.data as Product;
      setProducts((prev) => prev.map((p) => (p.id === id ? updatedProduct : p)));
      return updatedProduct;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar producto';
      setError(message);
      throw err; // Preservar el error original
    } finally {
      setLoading(false);
    }
  };

  // DELETE - Eliminar producto
  const deleteProduct = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar producto';
      setError(message);
      throw err; // Preservar el error original
    } finally {
      setLoading(false);
    }
  };

  // Funciones auxiliares para filtrar productos
  const getProductsByEvent = (eventId: number) => {
    return products.filter(product => product.eventId === eventId);
  };

  const getProductsByArtisan = (artisanId: number) => {
    return products.filter(product => product.artisanId === artisanId);
  };

  const getProductsByCategory = (category: string) => {
    return products.filter(product => 
      product.category?.toLowerCase().includes(category.toLowerCase())
    );
  };

  const searchProductsByName = (name: string) => {
    return products.filter(product => 
      product.name.toLowerCase().includes(name.toLowerCase())
    );
  };

  const getProductsWithLowStock = (threshold: number = 5) => {
    return products.filter(product => (product.stock || 0) <= threshold);
  };

  const getProductsOrderedByStock = (ascending: boolean = true) => {
    return [...products].sort((a, b) => {
      const stockA = a.stock || 0;
      const stockB = b.stock || 0;
      return ascending ? stockA - stockB : stockB - stockA;
    });
  };

  const getProductsOrderedByName = () => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  };

  const getUniqueCategories = () => {
    const categories = products
      .map(product => product.category)
      .filter((category): category is string => !!category);
    
    // Agregar categorías por defecto si no hay productos
    const defaultCategories = [
      'Bisutería',
      'Tejidos',
      'Cerámicas',
      'Artesanías',
      'Accesorios',
      'Decoración'
    ];
    
    const allCategories = [...new Set([...categories, ...defaultCategories])];
    return allCategories.sort();
  };

  // Función para determinar el estado del evento basado en fechas
  const getEventStatus = (event: { startDate?: string; endDate?: string; state?: string }) => {
    if (event.state === 'CLOSED') return 'CLOSED';
    if (!event.startDate || !event.endDate) return 'SCHEDULED';
    
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    if (now < startDate) return 'SCHEDULED';
    if (now > endDate) return 'CLOSED';
    return 'ACTIVE';
  };

  // Función para filtrar productos visibles según estado del evento y stock
  const getVisibleProducts = () => {
    return products.filter(product => {
      // Si no tiene información del evento, mostrarlo (fallback)
      if (!product.event) return true;
      
      const eventStatus = product.event.status || getEventStatus(product.event);
      const stock = product.stock || 0;
      
      // Si el evento está CLOSED, NO mostrar los productos independientemente del stock
      if (eventStatus === 'CLOSED') return false;
      
      // Si el evento está SCHEDULED, mostrar todos los productos
      if (eventStatus === 'SCHEDULED') return true;
      
      // Si el evento está ACTIVE, ocultar productos con stock 0
      if (eventStatus === 'ACTIVE') {
        return stock > 0;
      }
      
      // Fallback: mostrar el producto
      return true;
    });
  };

  // Función para obtener stock actualizado de un producto específico
  const refreshProductStock = async (productId: number) => {
    try {
      const product = await fetchProductById(productId);
      if (product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? product : p)));
      }
    } catch (err) {
      console.error('Error al actualizar stock del producto:', err);
    }
  };

  // Función para contar productos ocultos por stock 0 en eventos activos/cerrados
  const getHiddenProductsCount = () => {
    return products.length - getVisibleProducts().length;
  };

  // 🔥 NUEVAS FUNCIONES DE VALIDACIÓN

  // Validar si un evento permite editar productos (solo SCHEDULED)
  const canEditProductsInEvent = (event: { startDate?: string; endDate?: string; state?: string; status?: string }) => {
    const eventStatus = event.status || getEventStatus(event);
    return eventStatus === 'SCHEDULED';
  };

  // Validar si un evento permite crear productos (SCHEDULED y ACTIVE, no CLOSED)
  const canCreateProductsInEvent = (event: { startDate?: string; endDate?: string; state?: string; status?: string }) => {
    const eventStatus = event.status || getEventStatus(event);
    return eventStatus === 'SCHEDULED' || eventStatus === 'ACTIVE';
  };

  // Verificar si un producto puede ser editado basado en su evento
  const canEditProduct = (product: Product) => {
    if (!product.event) return false; // No se puede editar si no tiene info del evento
    return canEditProductsInEvent(product.event);
  };

  // Verificar si un producto puede ser eliminado basado en su evento
  const canDeleteProduct = (product: Product) => {
    if (!product.event) return false; // No se puede eliminar si no tiene info del evento
    return canEditProductsInEvent(product.event); // Misma regla que editar
  };

  // Validar unicidad de nombre por artesano y evento
  const validateProductNameUniqueness = (
    name: string, 
    eventId: number, 
    artisanId: number, 
    excludeProductId?: number
  ) => {
    const existingProduct = products.find(product => 
      product.name.toLowerCase() === name.toLowerCase() &&
      product.eventId === eventId &&
      product.artisanId === artisanId &&
      (excludeProductId ? product.id !== excludeProductId : true)
    );
    
    return {
      isValid: !existingProduct,
      message: existingProduct ? 'Ya existe un producto con ese nombre para este artesano en este evento' : ''
    };
  };

  // Validar datos antes de crear producto
  const validateCreateProduct = (
    product: CreateProduct,
    events: Array<{ id: number; startDate?: string; endDate?: string; state?: string; status?: string }>
  ) => {
    const errors: Record<string, string> = {};

         // Validar evento
     const event = events.find(e => e.id === product.eventId);
     if (!event) {
       errors.eventId = 'El evento seleccionado no existe';
     } else if (!canCreateProductsInEvent(event)) {
       errors.eventId = 'Solo se pueden crear productos en eventos programados o activos';
     }

    // Validar unicidad de nombre
    const nameValidation = validateProductNameUniqueness(
      product.name, 
      product.eventId, 
      product.artisanId
    );
    if (!nameValidation.isValid) {
      errors.name = nameValidation.message;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Validar datos antes de actualizar producto
  const validateUpdateProduct = (
    productId: number,
    updateData: UpdateProduct,
    events: Array<{ id: number; startDate?: string; endDate?: string; state?: string; status?: string }>
  ) => {
    const errors: Record<string, string> = {};
    const currentProduct = products.find(p => p.id === productId);

    if (!currentProduct) {
      errors.general = 'El producto no existe';
      return { isValid: false, errors };
    }

    // Validar evento actual (el producto debe estar en un evento SCHEDULED para poder editarse)
    if (!canEditProduct(currentProduct)) {
      errors.general = 'Solo puedes modificar productos antes de que el evento inicie';
      return { isValid: false, errors };
    }

    // Si se cambia el evento, validar el nuevo evento
    if (updateData.eventId && updateData.eventId !== currentProduct.eventId) {
      const newEvent = events.find(e => e.id === updateData.eventId);
      if (!newEvent) {
        errors.eventId = 'El evento seleccionado no existe';
      } else if (!canEditProductsInEvent(newEvent)) {
        errors.eventId = 'Solo se puede cambiar a eventos programados (no iniciados)';
      }
    }

    // Validar unicidad de nombre si cambia
    if (updateData.name && updateData.name !== currentProduct.name) {
      const nameValidation = validateProductNameUniqueness(
        updateData.name,
        updateData.eventId || currentProduct.eventId,
        updateData.artisanId || currentProduct.artisanId,
        productId
      );
      if (!nameValidation.isValid) {
        errors.name = nameValidation.message;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Validar antes de eliminar producto
  const validateDeleteProduct = (productId: number) => {
    const errors: Record<string, string> = {};
    const product = products.find(p => p.id === productId);

    if (!product) {
      errors.general = 'El producto no existe';
      return { isValid: false, errors };
    }

    if (!canDeleteProduct(product)) {
      errors.general = 'Solo puedes eliminar productos antes de que el evento inicie';
      return { isValid: false, errors };
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  return {
    products,
    loading,
    error,
    setProducts,
    fetchProducts,
    fetchProductById,
    createProduct,
    editProduct,
    deleteProduct,
    // Funciones auxiliares
    getProductsByEvent,
    getProductsByArtisan,
    getProductsByCategory,
    searchProductsByName,
    getProductsWithLowStock,
    getProductsOrderedByStock,
    getProductsOrderedByName,
    getUniqueCategories,
    getVisibleProducts,
    getHiddenProductsCount,
    refreshProductStock,
    // Nuevas funciones de validación
    canEditProduct,
    canDeleteProduct,
    canEditProductsInEvent,
    canCreateProductsInEvent,
    validateProductNameUniqueness,
    validateCreateProduct,
    validateUpdateProduct,
    validateDeleteProduct,
  };
} 