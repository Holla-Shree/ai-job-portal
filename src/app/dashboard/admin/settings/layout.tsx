
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/layout/AppLogo';
import { User, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const settingsNav = [
  { name: 'Profile', href: '/dashboard/admin/settings/profile', icon: User },
  { name: 'Security', href: '/dashboard/admin/settings/security', icon: Shield },
];

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="h-full">
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex h-12 items-center justify-between px-2 group-data-[collapsible=icon]:justify-center">
              <div className="overflow-hidden whitespace-nowrap group-data-[collapsible=icon]:w-0">
                  <AppLogo />
              </div>
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
               <SidebarGroup>
                  <SidebarGroupLabel>Admin Settings</SidebarGroupLabel>
                  {settingsNav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton
                              asChild
                              isActive={pathname === item.href}
                              tooltip={item.name}
                          >
                              <Link href={item.href}>
                                  <item.icon />
                                  <span>{item.name}</span>
                              </Link>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                  ))}
               </SidebarGroup>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="p-4 sm:p-6 md:p-8 flex items-center justify-between border-b">
              <div>
                <Button asChild variant="ghost" className="mb-2 -ml-4">
                  <Link href="/dashboard/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Admin Dashboard
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold font-headline">Admin Settings</h1>
              </div>
              <SidebarTrigger className="hidden md:flex" />
          </div>
          <div className="p-4 sm:p-6 md:p-8">
              {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
