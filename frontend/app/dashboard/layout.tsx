'use client';

import { ReactNode } from 'react';
import { useDashboardProtection } from "@/app/login/hooks/useAuth";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { shouldShowDashboard, isLoading } = useDashboardProtection();

  // Loading state mientras verificamos autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, el hook se encarga de la redirección
  if (!shouldShowDashboard) {
    return null;
  }

  // Renderizar el contenido protegido
  return <>{children}</>;
} 