
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
import { UserPlus } from 'lucide-react';
import { AppLogo } from '@/components/layout/AppLogo';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
        fullName: '',
        email: '',
        password: '',
        role: 'user',
    }
  });

  const onSubmit = async (data: SignupFormValues) => {
    const { role, fullName, email } = data;
    
    const entityId = `${role}-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
    const collectionName = role === 'user' ? 'candidates' : 'recruiters';

    try {
        await setDoc(doc(db, collectionName, entityId), {
            id: entityId,
            name: fullName,
            email: email,
            profile: `Newly registered ${role}. Please update your profile.`,
            avatar: `https://placehold.co/40x40.png?text=${fullName.charAt(0).toUpperCase()}`
        });
    } catch (error) {
        console.error(`Error creating ${role} profile in Firestore:`, error);
        toast({
            title: 'Signup Failed',
            description: `Could not create your ${role} profile. Please try again.`,
            variant: 'destructive',
        });
        return;
    }

    toast({
      title: 'Account Created!',
      description: "You have been successfully signed up.",
    });

    login(role as UserRole, entityId, email, fullName);

    switch (role) {
      case 'user':
        router.push('/dashboard/user/settings/profile');
        break;
      case 'recruiter':
        router.push('/dashboard/recruiter/settings/profile');
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
          <CardDescription>Join AI JobPortal to find your dream job or the perfect candidate.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                          <FormLabel>Account Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="user" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Job Seeker
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="recruiter" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Recruiter
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
                        <UserPlus className="mr-2 h-5 w-5" />
                        Sign Up
                    </Button>
                    <Separator />
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="font-semibold text-primary hover:underline">
                                Sign In
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
