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
    refreshProductStock,
  };
} 