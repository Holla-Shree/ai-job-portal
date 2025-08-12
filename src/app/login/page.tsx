
'use client';

import React from 'react';
import { AppLogo } from '@/components/layout/AppLogo';
import LoginForm from '@/components/layout/LoginForm';


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
