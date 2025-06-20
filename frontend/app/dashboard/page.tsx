"use client";

import Image from "next/image";
import { AppSidebar } from "@/app/dashboard/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  } from "@/app/dashboard/components/sidebar";

export default function DashboardPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-3rem)] bg-gray-50">
          {/* Contenedor principal */}
          <div className="flex flex-col items-center justify-center space-y-2 max-w-4xl mx-auto px-4">
            <div className="text-center">
              <p className="text-lg text-gray-600">
                Selecciona una opción del menú para comenzar
              </p>
            </div>

            {/* Logo principal usando tu imagen welcome.png */}
            <div className="relative">
              <Image
                src="/images/welcome.png"
                alt="Bienvenido al sistema de ferias IUIAI WASI"
                width={800}
                height={600}
                className="w-full max-w-4xl h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
