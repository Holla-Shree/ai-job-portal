'use client';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AppLogo() {
  const { user } = useAuth();

  const getHomeLink = () => {
    if (!user) {
      return '/';
    }
    switch (user.role) {
      case 'user':
        return '/dashboard/user';
      case 'recruiter':
        return '/dashboard/recruiter';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/';
    }
  };

  return (
    <Link href={getHomeLink()} className="flex items-center gap-2 text-primary transition-colors hover:text-primary/90">
      <Briefcase className="h-7 w-7" />
      <span className="font-headline text-xl font-semibold">
        JobMatch AI
      </span>
    </Link>
  );
}
