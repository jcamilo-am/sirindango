"use client"

import * as React from "react"
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

const data = {
  user: {
    name: "USER NAME",
    email: "ADMIN",
    src: "/images/logo-sirindango.png",
  },
  navMain: [
    {
      title: "Eventos",
      url: "/dashboard/eventos",
      icon: IconChartBar,
    },
    {
      title: "Registrar productos",
      url: "/dashboard/registrar-producto",
      icon: IconPackage,
    },
    {
      title: "Registrar ventas",
      url: "/dashboard/registrar-venta",
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
    {
      title: "Cerrar sesión",
      url: "#",
      icon: IconLogout,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
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
          {data.navMain.map((item) => {
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
                  <Link href={item.url} className="flex items-center gap-3 w-full">
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className=" border-t p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
            <IconUsers className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium">{data.user.name}</span>
            <span className="text-gray-400 text-xs">{data.user.email}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
