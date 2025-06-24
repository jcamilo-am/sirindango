// Configuración del backend
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://sirindango.onrender.com',
  ENDPOINTS: {
    LOGIN: '/auth/login',
    // Aquí puedes agregar más endpoints conforme los necesites
    USERS: '/users',
    EVENTS: '/events',
    PRODUCTS: '/products',
    ARTISANS: '/artisans',
    SALES: '/sales',
  }
};

// Función helper para construir URLs completas
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Headers por defecto para las peticiones
export const getDefaultHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Función helper para manejar respuestas de la API
export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `Error ${response.status}`);
  }
  
  return response.json();
}; 