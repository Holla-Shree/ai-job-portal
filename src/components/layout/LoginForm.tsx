
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
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

  const onSubmit = async (data: LoginFormValues) => {
    let role: 'user' | 'recruiter' | 'admin' = 'user';
    let name = data.email.split('@')[0];
    let id: string | null = null;
    let avatar: string | undefined = undefined;

    try {
        // Check if user is an admin
        let q = query(collection(db, 'admins'), where('email', '==', data.email));
        let querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const adminData = querySnapshot.docs[0].data();
            role = 'admin';
            id = querySnapshot.docs[0].id;
            name = adminData.name;
            avatar = adminData.avatar;
        } else {
            // Check if user is a recruiter
            q = query(collection(db, 'recruiters'), where('email', '==', data.email));
            querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const recruiterData = querySnapshot.docs[0].data();
                role = 'recruiter';
                id = querySnapshot.docs[0].id;
                name = recruiterData.name;
                avatar = recruiterData.avatar;
            } else {
                // Default to user role, check if they exist
                 q = query(collection(db, 'candidates'), where('email', '==', data.email));
                 querySnapshot = await getDocs(q);
                 if (!querySnapshot.empty) {
                    const candidateData = querySnapshot.docs[0].data();
                    role = 'user';
                    id = querySnapshot.docs[0].id;
                    name = candidateData.name;
                    avatar = candidateData.avatar;
                 } else {
                    toast({
                        title: 'Login Failed',
                        description: 'No account found with this email.',
                        variant: 'destructive',
                    });
                    return;
                 }
            }
        }
        
        toast({
            title: 'Login Successful',
            description: `Welcome back, ${name}! You are now logged in as a ${role}.`,
        });

        login(role, id, data.email, name, avatar);

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

    } catch (error) {
        console.error("Login error:", error);
        toast({
            title: 'Login Error',
            description: 'An unexpected error occurred. Please try again.',
            variant: 'destructive',
        });
    }
  };

  return (
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
  );
}
