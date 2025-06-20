'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const authStatus = AuthService.isAuthenticated();
      const userData = AuthService.getUser();
      
      setIsAuthenticated(authStatus);
      setUser(userData);
    } catch (error) {
      // Si hay error al verificar, asumir no autenticado
      setIsAuthenticated(false);
      setUser(null);
      // Limpiar datos corruptos
      AuthService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    logout
  };
}

// Hook específico para proteger la página de login
export function useLoginProtection() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir cuando ya no estemos cargando
    if (!isLoading && isAuthenticated) {
      // Usuario ya autenticado, redirigir al dashboard
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return {
    isAuthenticated,
    isLoading,
    shouldShowLogin: !isLoading && !isAuthenticated
  };
}

// Hook para proteger rutas del dashboard (para uso futuro)
export function useDashboardProtection() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir cuando ya no estemos cargando
    if (!isLoading && !isAuthenticated) {
      // Usuario no autenticado, redirigir al login
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return {
    isAuthenticated,
    isLoading,
    shouldShowDashboard: !isLoading && isAuthenticated
  };
} 