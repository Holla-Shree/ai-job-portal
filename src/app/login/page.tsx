
'use client';

import { AppLogo } from '@/components/layout/AppLogo';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import React from 'react';

const LoginForm = dynamic(() => import('@/components/layout/LoginForm'), {
  ssr: false,
  loading: () => <div className="h-[480px] w-full max-w-md flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
});

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <div className="absolute top-8 left-8">
        <AppLogo />
      </div>
      <LoginForm />
    </div>
  );
}
