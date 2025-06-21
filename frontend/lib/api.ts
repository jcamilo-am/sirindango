import axios from 'axios';
import { AuthService } from './auth';

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar automáticamente el token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log para debug (remover en producción)
    console.log('Interceptor - Error completo:', error);
    console.log('Interceptor - Error response:', error.response);
    console.log('Interceptor - Error response data:', error.response?.data);
    
    if (error.response?.status === 401) {
      // Token expirado o inválido, limpiar y redirigir al login
      AuthService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { apiClient }; 