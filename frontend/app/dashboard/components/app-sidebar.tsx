"use client"

import React from "react"
import Image from "next/image"
import {
  IconChartBar,
  IconLogout,
  IconPackage,
  IconSettings,
  IconShoppingCart,
  IconUsers,
} from "@tabler/icons-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./sidebar"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/app/login/hooks/useAuth"

const navMainItems = [
  {
    title: "Eventos",
    url: "/dashboard/events",
    icon: IconChartBar,
  },
  {
    title: "Registrar productos",
    url: "/dashboard/products",
    icon: IconPackage,
  },
  {
    title: "Artesanas",
    url: "/dashboard/artisans",
    icon: IconUsers,
  },
  {
    title: "Registrar ventas",
    url: "/dashboard/sales",
    icon: IconShoppingCart,
  },
  {
    title: "Resumen por integrantes",
    url: "/dashboard/resume",
    icon: IconChartBar,
  },
  {
    title: "Configuración",
    url: "#",
    icon: IconSettings,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <Sidebar collapsible="offcanvas" className=" text-white border-r-0" {...props}>
      <SidebarHeader className=" border-b  p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full flex items-center justify-center">
            <Image 
              src="/images/logo-sirindango.png"
              alt="Logo IUIAI WASI"
              width={80}
              height={80}
              className="object-cover rounded-full"
            />
          </div>
          <span className="text-white font-semibold text-sm tracking-wider">IUIAI WASI</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4">
        <SidebarMenu>
          {/* Elementos de navegación normales */}
          {navMainItems.map((item) => {
            let isActive = false;
            if (item.url === "/dashboard") {
              isActive = pathname === "/dashboard";
            } else if (item.url !== "#") {
              isActive = pathname.startsWith(item.url);
            }
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg hover:text-black hover:bg-white transition-colors
                    ${isActive ? 'bg-white text-black' : 'text-white'}
                  `}
                >
                  <Link href={item.url} className="flex items-center gap-3 w-full border-l-4 border-l-orange-500">
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm ">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          
          {/* Botón de logout separado */}
          <SidebarMenuItem>
            <SidebarMenuButton
              className="flex items-center gap-3 px-3 py-3 rounded-lg border-l-4 border-l-red-500 hover:text-black hover:bg-red-50 hover:border-red-200 transition-colors text-white cursor-pointer"
              onClick={handleLogout}
            >
              <div className="flex items-center gap-3 w-full">
                <IconLogout className="h-5 w-5" />
                <span className="text-sm">Cerrar sesión</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className=" border-t p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
            <IconUsers className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium">
              {user?.username || 'Usuario'}
            </span>
            <span className="text-gray-400 text-xs">
              {user?.role?.toUpperCase() || 'ADMIN'}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
