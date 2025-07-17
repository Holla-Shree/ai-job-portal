
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Briefcase, User, MapPin, MessageSquare, Shield } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';

const navItems = [
  { href: '/dashboard/user', label: 'User Portal', icon: User },
  { href: '/dashboard/recruiter', label: 'Recruiter Portal', icon: Briefcase },
  { href: '/map', label: 'Job Map', icon: MapPin },
  { href: '/chatbot', label: 'AI Chatbot', icon: MessageSquare },
  { href: '/dashboard/admin', label: 'Admin Panel', icon: Shield },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="hidden md:flex">
          <AppLogo />
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[300px] bg-sidebar text-sidebar-foreground p-0">
            <div className="p-4">
             <AppLogo />
            </div>
            <nav className="flex flex-col gap-2 p-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    pathname === item.href ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
           <ModeToggle />
          {/* Placeholder for Auth buttons */}
          {/* <Button variant="outline" size="sm">Sign In</Button>
          <Button size="sm">Sign Up</Button> */}
        </div>
      </div>
    </header>
  );
}
