

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function RecruiterProfilePage() {
    const { user, updateAvatar } = useAuth();
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [name, setName] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        // A real app would fetch this from a recruiter profile in the DB.
        // We'll simulate it based on the user's email for now.
        if (user?.email) {
            const simulatedName = user.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            setName(simulatedName || 'Recruiter Admin');
        } else {
            setName('Recruiter Admin');
        }
    }, [user?.email]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                await updateAvatar(file);
                toast({
                    title: 'Profile Picture Updated',
                    description: 'Your new company logo has been saved.',
                });
            } catch (error) {
                console.error("Error uploading avatar:", error);
                toast({
                    title: 'Upload Failed',
                    description: 'Could not update your profile picture.',
                    variant: 'destructive',
                });
            } finally {
                setIsUploading(false);
            }
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Recruiter Profile</CardTitle>
                <CardDescription>Manage your personal and company information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarClick}>
                            <AvatarImage src={user?.avatar} alt="Company Logo" data-ai-hint="company logo" />
                            <AvatarFallback>R</AvatarFallback>
                        </Avatar>
                        {isUploading && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Button variant="outline" onClick={handleAvatarClick} disabled={isUploading}>
                            {isUploading ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                        <p className="text-xs text-muted-foreground">Click the avatar or button to upload a new logo. (PNG, JPG)</p>
                        <Input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/png, image/jpeg"
                            disabled={isUploading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                        id="fullName" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={user?.email || ''} disabled />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" defaultValue="Tech Solutions Inc." />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="companyWebsite">Company Website</Label>
                    <Input id="companyWebsite" defaultValue="https://example.com" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="recruiterBio">Company Bio</Label>
                    <Textarea id="recruiterBio" rows={4} defaultValue="Tech Solutions Inc. is a leading provider of innovative technology solutions, specializing in cloud computing and enterprise software. We are always looking for talented individuals to join our team." />
                </div>
            </CardContent>
            <CardFooter>
                <Button>Save Changes</Button>
            </CardFooter>
        </Card>
    );
}
