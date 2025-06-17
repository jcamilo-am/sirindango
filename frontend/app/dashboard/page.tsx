'use client';

import { AppSidebar } from "@/app/dashboard/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/app/dashboard/components/sidebar";
import { SiteHeader } from "@/app/dashboard/components/site-header";

export default function DashboardPage() {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center h-full">
          <h1 className="text-3xl font-bold text-white mt-20">Bienvenido al Sistema de Ferias IUIAI WASI</h1>
          <p className="text-lg text-gray-300 mt-4">Selecciona una opción del menú para comenzar.</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
