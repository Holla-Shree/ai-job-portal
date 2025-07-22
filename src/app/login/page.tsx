
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import { AppLogo } from '@/components/layout/AppLogo';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    // In a real app, you'd validate credentials. Here, we'll assign roles based on email.
    let role: 'user' | 'recruiter' | 'admin' = 'user';
    if (data.email.includes('recruiter')) {
      role = 'recruiter';
    } else if (data.email.includes('admin')) {
      role = 'admin';
    }

    toast({
      title: 'Login Successful',
      description: `Welcome! You are now logged in as a ${role}.`,
    });

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
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <div className="absolute top-8 left-8">
            <AppLogo />
        </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="font-headline text-3xl">Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="user@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" size="lg">
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                    </Button>
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                        Hint: use 'recruiter@example.com' or 'admin@example.com' to log in as other roles.
                        </p>
                    </div>
                    <Separator />
                    <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link href="/signup" className="font-semibold text-primary hover:underline">
                            Sign Up
                        </Link>
                    </p>
                    </div>
              </CardFooter>
            </form>
        </Form>
      </Card>
    </div>
  );
}
