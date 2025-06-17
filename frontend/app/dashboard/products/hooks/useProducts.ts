import { useState } from 'react';
import axios from 'axios';
import { ProductListSchema, Product, CreateProductSchema, CreateProduct } from '../models/product';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products`);
      const data = ProductListSchema.parse(res.data);
      setProducts(data);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  // CREATE
  const createProduct = async (product: CreateProduct) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = CreateProductSchema.parse(product);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/products`, parsed);
      setProducts((prev) => [...prev, res.data]);
      return res.data as Product;
    } catch (err: any) {
      setError(err?.message || 'Error al crear producto');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // EDIT
  const editProduct = async (id: number, product: Partial<CreateProduct>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, product);
      setProducts((prev) => prev.map((p) => (p.id === id ? res.data : p)));
      return res.data as Product;
    } catch (err: any) {
      setError(err?.message || 'Error al editar producto');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const deleteProduct = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar producto');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    setProducts,
    fetchProducts,
    createProduct,
    editProduct,
    deleteProduct,
  };
} 