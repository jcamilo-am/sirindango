import { API_CONFIG, getApiUrl, getDefaultHeaders } from './config';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'token';
  private static readonly USER_KEY = 'user';

  // Login del usuario
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.LOGIN);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          if (response.status === 404) {
            errorMessage = 'Servicio no disponible';
          }
        }
        
        throw new Error(errorMessage);
      }

      const data: LoginResponse = await response.json();
      
      // Validar que la respuesta tenga los datos esperados
      if (!data.access_token || !data.user) {
        throw new Error('Respuesta inválida del servidor');
      }

      return data;
      
    } catch (fetchError) {
      if (fetchError instanceof TypeError) {
        // Error de red (backend no disponible)
        throw new Error('No se puede conectar al servidor. Intenta más tarde');
      }
      
      // Re-lanzar otros errores
      throw fetchError;
    }
  }

  // Guardar datos de autenticación
  static saveAuthData(loginData: LoginResponse): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, loginData.access_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(loginData.user));
    }
  }

  // Obtener token guardado
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  // Obtener usuario guardado
  static getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  // Verificar si el usuario está autenticado
  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Logout - limpiar datos de autenticación
  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  // Headers con autorización para requests autenticados
  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return getDefaultHeaders(token || undefined);
  }
} 