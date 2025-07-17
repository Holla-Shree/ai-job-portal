
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Briefcase, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (role: UserRole) => {
    login(role);
    // Redirect based on role
    switch (role) {
      case 'user':
        router.push('/dashboard/user');
        break;
      case 'recruiter':
        router.push('/dashboard/recruiter');
        break;
      case 'admin':
        router.push('/dashboard/admin');
        break;
      default:
        router.push('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Sign In As</CardTitle>
          <CardDescription>Select a role to simulate logging in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => handleLogin('user')}
            className="w-full"
            size="lg"
          >
            <User className="mr-2 h-5 w-5" />
            Job Seeker
          </Button>
          <Button
            onClick={() => handleLogin('recruiter')}
            className="w-full"
            size="lg"
            variant="secondary"
          >
            <Briefcase className="mr-2 h-5 w-5" />
            Recruiter
          </Button>
          <Button
            onClick={() => handleLogin('admin')}
            className="w-full"
            size="lg"
            variant="outline"
          >
            <Shield className="mr-2 h-5 w-5" />
            Admin
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
