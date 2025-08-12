
'use client';

import React, { useState, useEffect } from 'react';
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
import { LogIn, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
  role: z.enum(['user', 'recruiter', 'admin'], {
    required_error: "You must select a role to log in.",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'user',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    let name = data.email.split('@')[0];
    let id: string | null = null;
    let avatar: string | undefined = undefined;

    let collectionName: 'candidates' | 'recruiters' | 'admins' = 'candidates';
    if (data.role === 'recruiter') {
        collectionName = 'recruiters';
    } else if (data.role === 'admin') {
        collectionName = 'admins';
    }


    try {
        const q = query(collection(db, collectionName), where('email', '==', data.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({
                title: 'Login Failed',
                description: `No ${data.role} account found with this email.`,
                variant: 'destructive',
            });
            return;
        }

        const userData = querySnapshot.docs[0].data();
        id = querySnapshot.docs[0].id;
        name = userData.name;
        avatar = userData.avatar;
        
        toast({
            title: 'Login Successful',
            description: `Welcome back, ${name}!`,
        });

        await login(data.role as UserRole, id, data.email, name, avatar);

        switch (data.role) {
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

  if (!isClient) {
    return (
        <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center space-y-2">
                <CardTitle className="font-headline text-3xl">Sign In</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                 <Button type="submit" className="w-full" size="lg" disabled>
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
        </Card>
    )
  }

  return (
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="font-headline text-3xl">Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Log in as</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex gap-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="user" id="role-user" />
                                </FormControl>
                                <FormLabel htmlFor="role-user" className="font-normal">
                                  Job Seeker
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="recruiter" id="role-recruiter" />
                                </FormControl>
                                <FormLabel htmlFor="role-recruiter" className="font-normal">
                                  Recruiter
                                </FormLabel>
                              </FormItem>
                               <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="admin" id="role-admin" />
                                </FormControl>
                                <FormLabel htmlFor="role-admin" className="font-normal">
                                  Admin
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
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
