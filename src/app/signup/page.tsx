
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import { AppLogo } from '@/components/layout/AppLogo';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const signupSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(['user', 'recruiter'], {
    required_error: "You need to select an account type.",
  }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupFormValues) => {
    const { role } = data;
    
    toast({
      title: 'Account Created!',
      description: "You have been successfully signed up.",
    });

    login(role as UserRole);

    // Redirect based on role
    switch (role) {
      case 'user':
        router.push('/dashboard/user');
        break;
      case 'recruiter':
        router.push('/dashboard/recruiter');
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
          <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
          <CardDescription>Join JobMatch AI to find your dream job or the perfect candidate.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="John Doe" {...form.register('fullName')} />
              {form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" {...form.register('email')} />
              {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register('password')} />
              {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            <div className="space-y-2">
                 <Label>Account Type</Label>
                 <RadioGroup
                    onValueChange={(value) => form.setValue('role', value as 'user' | 'recruiter')}
                    className="flex gap-4 pt-2"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="user" id="role-user" />
                        <Label htmlFor="role-user">Job Seeker</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="recruiter" id="role-recruiter" />
                        <Label htmlFor="role-recruiter">Recruiter</Label>
                    </div>
                </RadioGroup>
                {form.formState.errors.role && <p className="text-xs text-destructive pt-2">{form.formState.errors.role.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" size="lg">
              <UserPlus className="mr-2 h-5 w-5" />
              Sign Up
            </Button>
            <Separator />
             <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign In
                </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
