'use client';

import { LoginForm } from "@/app/login/login-form"
import { useLoginProtection } from "@/app/login/hooks/useAuth"

export default function LoginPage() {
  const { shouldShowLogin, isLoading } = useLoginProtection();

  // Mostrar loading mientras verificamos el estado de autenticación
  if (isLoading) {
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        {/* Imagen de fondo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/login-foto.png')"
          }}
        />
        
        {/* Overlay para mejorar legibilidad */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Loading spinner */}
        <div className="relative z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  // Solo mostrar el formulario si el usuario NO está autenticado
  if (!shouldShowLogin) {
    return null; // El hook se encarga de la redirección
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      {/* Imagen de fondo */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/login-foto.png')"
        }}
      />
      
      {/* Overlay para mejorar legibilidad */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Contenido del formulario */}
      <div className="relative z-10 flex w-full max-w-sm flex-col gap-6 mt-10">
        <LoginForm />
      </div>
    </div>
  )
}
