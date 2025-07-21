
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Briefcase, User, MapPin, MessageSquare, Shield, LogOut, LogIn, UserCircle } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


const navItems = [
  { href: '/dashboard/user', label: 'Dashboard', icon: User, roles: ['user', 'admin'] },
  { href: '/dashboard/user/settings/profile', label: 'My Profile', icon: UserCircle, roles: ['user', 'admin'] },
  { href: '/dashboard/recruiter', label: 'Recruiter Portal', icon: Briefcase, roles: ['recruiter', 'admin'] },
  { href: '/map', label: 'Job Map', icon: MapPin, roles: ['user', 'recruiter', 'admin'] },
  { href: '/chatbot', label: 'AI Chatbot', icon: MessageSquare, roles: ['user', 'recruiter', 'admin'] },
  { href: '/dashboard/admin', label: 'Admin Panel', icon: Shield, roles: ['admin'] },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  const getVisibleNavItems = () => {
      if (!user) return [];
      let items = navItems.filter(item => item.roles.includes(user.role));
      // Special rule: don't show both "Dashboard" and "My Profile" if not a user
      if(user.role !== 'user') {
        items = items.filter(item => item.href !== '/dashboard/user/settings/profile');
        items = items.filter(item => item.href !== '/dashboard/user');
      }
      return items;
  }

  const visibleNavItems = getVisibleNavItems();
  
  const getInitials = (role: string) => {
    return role.charAt(0).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <AppLogo />
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {visibleNavItems.map((item) => (
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
        </div>
        
        <div className="md:hidden">
            <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[300px] bg-sidebar text-sidebar-foreground p-0">
                <div className="p-4">
                <AppLogo />
                </div>
                <nav className="flex flex-col gap-2 p-4">
                {visibleNavItems.map((item) => (
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
        </div>
        
        <div className="flex items-center gap-2">
           <ModeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                     <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(user.role)}`} alt={user.role} data-ai-hint="person avatar"/>
                     <AvatarFallback>{getInitials(user.role)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Logged in as</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4"/>
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
