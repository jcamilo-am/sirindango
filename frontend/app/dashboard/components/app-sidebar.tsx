"use client"

import React from "react"
import Image from "next/image"
import {
  IconChartBar,
  IconLogout,
  IconPackage,
  IconShoppingCart,
  IconUsers,
  IconClipboardList,
  IconArrowsExchange,
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
    title: "Artesanos",
    url: "/dashboard/artisans",
    icon: IconUsers,
  },
  {
    title: "Inventario",
    url: "/dashboard/inventory",
    icon: IconClipboardList,
  },
  {
    title: "Registrar ventas",
    url: "/dashboard/sales",
    icon: IconShoppingCart,
  },
  {
    title: "Cambios de productos",
    url: "/dashboard/change",
    icon: IconArrowsExchange,
  },
  {
    title: "Resumen por integrantes",
    url: "/dashboard/resume",
    icon: IconChartBar,
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
    <Sidebar collapsible="offcanvas" className=" text-black border-r-1" {...props}>
      <SidebarHeader className=" border-b  p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full flex items-center justify-center">
            <Image 
              src="/images/logo-sirindango.png"
              alt="Logo IUIAI WASI"
              width={80}
              height={80}
              className="object-cover rounded-full border-2 border-black"
            />
          </div>
          <span className="text-black font-semibold text-md tracking-wider">IUIAI WASI</span>
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
                    flex items-center gap-3 px-3 py-3 rounded-lg hover:text-black hover:bg-gray-300 transition-colors backdrop-blur-sm border
                    ${isActive ? 'bg-orange-300 text-black font-bold hover:bg-orange-500 hover:text-white' : 'text-black'}
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
              className="flex items-center bg-red-500 gap-3 px-3 py-3 rounded-lg border-l-4 border-l-red-800 hover:text-white hover:font-bold hover:bg-red-600 transition-colors text-white cursor-pointer"
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
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <IconUsers className="h-5 w-5 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-black text-sm font-medium">
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
