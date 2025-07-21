
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
import { User, Lock, Bell, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const settingsNav = [
  { name: 'Profile', href: '/dashboard/user/settings/profile', icon: User },
  { name: 'Security', href: '/dashboard/user/settings/security', icon: Lock },
  { name: 'Privacy', href: '/dashboard/user/settings/privacy', icon: Shield },
  { name: 'Communications', href: '/dashboard/user/settings/communication', icon: Bell },
  { name: 'Account', href: '/dashboard/user/settings/account', icon: CreditCard },
];

export default function SettingsLayout({
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
                  <SidebarGroupLabel>Settings</SidebarGroupLabel>
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
              <h1 className="text-2xl font-bold font-headline">Settings</h1>
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
