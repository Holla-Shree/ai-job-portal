
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: UserRole[]
) => {
  const AuthComponent: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.replace('/login');
        } else if (!allowedRoles.includes(user.role)) {
          // Optional: redirect to a specific page based on role or a general access-denied page
          // For now, redirecting to their default dashboard
          switch (user.role) {
            case 'user':
              router.replace('/dashboard/user');
              break;
            case 'recruiter':
              router.replace('/dashboard/recruiter');
              break;
            case 'admin':
              router.replace('/dashboard/admin');
              break;
            default:
              router.replace('/');
          }
        }
      }
    }, [user, loading, router]);

    if (loading || !user || !allowedRoles.includes(user.role)) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;
