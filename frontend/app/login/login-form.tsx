'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthService, type LoginCredentials } from '@/lib/auth';

interface FieldErrors {
  username?: string;
  password?: string;
  general?: string;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Validación simple - solo campos requeridos
  const validateFields = (): boolean => {
    const errors: FieldErrors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'El nombre de usuario es requerido';
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler para el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setFieldErrors({});
    
    // Validar campos básicos
    if (!validateFields()) {
      return;
    }
    
    setLoading(true);
    
              try {
      // Usar el servicio de autenticación
      const credentials: LoginCredentials = {
        username: formData.username.trim(),
        password: formData.password
      };
      
      const loginData = await AuthService.login(credentials);
      
      // Guardar datos de autenticación
      AuthService.saveAuthData(loginData);
      
      // Mostrar mensaje de éxito
      toast.success(`¡Bienvenido, ${loginData.user.username}!`);
      
      // Redirigir al dashboard después de un breve delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Manejar errores específicos del backend de forma genérica
        if (err.message === 'Usuario no encontrado' || err.message === 'Contraseña incorrecta') {
          toast.error('Usuario o contraseña inválidos');
        } else if (err.message.includes('400')) {
          toast.error('Datos de entrada inválidos');
        } else if (err.message.includes('429')) {
          toast.error('Demasiados intentos de inicio de sesión. Intenta más tarde');
        } else if (err.message.includes('500')) {
          toast.error('Error del servidor. Intenta más tarde');
        } else if (err.message.includes('fetch') || err.message.includes('NetworkError')) {
          toast.error('No se puede conectar al servidor. Intenta más tarde');
        } else {
          toast.error('Error al iniciar sesión. Intenta más tarde');
        }
      } else {
        toast.error('Error inesperado. Intenta más tarde');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler para cambios en los inputs
  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir/modificar
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <ToastContainer 
        position="top-right" 
        autoClose={4000} 
        hideProgressBar={false} 
        newestOnTop 
        closeOnClick 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="colored"
      />
      <Card className="w-full max-w-md mx-auto backdrop-blur-sm bg-black/95">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-turquoise-light tracking-wide">
            SIRINDANGO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Username */}
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <Input
                  id="username"
                  type="text"
                  placeholder="Usuario"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={cn(
                    "pl-10 bg-gray-50 border-gray-200 text-white placeholder:text-gray-400",
                    fieldErrors.username && "border-red-500 focus:border-red-500"
                  )}
                  disabled={loading}
                />
              </div>
              {fieldErrors.username && (
                <p className="text-xs text-red-600 font-medium">{fieldErrors.username}</p>
              )}
            </div>
            
            {/* Campo Password */}
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={cn(
                    "pl-10 pr-10 bg-gray-50 border-gray-200 text-white placeholder:text-gray-400",
                    fieldErrors.password && "border-red-500 focus:border-red-500"
                  )}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 disabled:opacity-50"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-600 font-medium">{fieldErrors.password}</p>
              )}
            </div>
            
            {/* Error general */}
            {fieldErrors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{fieldErrors.general}</p>
              </div>
            )}
            
            {/* Botón de envío */}
            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-white hover:text-black text-white py-2.5 mt-6 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
