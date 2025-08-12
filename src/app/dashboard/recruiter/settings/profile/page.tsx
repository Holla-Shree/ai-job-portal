

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
import { CloudinaryUploadWidget } from '@/components/CloudinaryUploadWidget';
import { useNotifications } from '@/contexts/NotificationContext';


export default function RecruiterProfilePage() {
    const { user, updateUserAvatar, loading: authLoading } = useAuth();
    const { recruiters, updateRecruiterProfile } = useNotifications();
    const { toast } = useToast();
    
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [companyBio, setCompanyBio] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isClient, setIsClient] = useState(false);

    const currentRecruiterProfile = React.useMemo(() => {
        return recruiters.find(r => r.id === user?.id);
    }, [recruiters, user]);

    useEffect(() => {
        setIsClient(true);
        if (currentRecruiterProfile) {
            setName(currentRecruiterProfile.name || '');
            setCompanyName(currentRecruiterProfile.companyName || '');
            setCompanyWebsite(currentRecruiterProfile.companyWebsite || '');
            setCompanyBio(currentRecruiterProfile.companyBio || '');
        } else if (user?.email) {
            const simulatedName = user.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            setName(simulatedName || 'Recruiter Admin');
        }
    }, [currentRecruiterProfile, user?.email]);

    const handleUploadSuccess = async (result: any) => {
        const secureUrl = result?.info?.secure_url;
        if (secureUrl && user) {
            try {
                await updateUserAvatar(secureUrl);
                toast({
                    title: 'Profile Picture Updated',
                    description: 'Your new company logo has been saved.',
                });
            } catch (error) {
                 console.error("Error saving avatar url:", error);
                 toast({
                    title: 'Update Failed',
                    description: 'Could not save your new profile picture.',
                    variant: 'destructive',
                 });
            }
        }
    };
    
    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await updateRecruiterProfile(user.id, {
                name,
                companyName,
                companyWebsite,
                companyBio,
            });
            toast({
                title: 'Profile Saved',
                description: 'Your company profile has been successfully updated.',
            });
        } catch (error) {
             console.error("Error saving recruiter profile:", error);
             toast({
                title: 'Save Failed',
                description: 'Could not save your profile changes.',
                variant: 'destructive',
             });
        } finally {
            setIsSaving(false);
        }
    }

    if (!isClient || authLoading) {
        return (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Recruiter Profile</CardTitle>
                <CardDescription>Manage your personal and company information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-20 w-20">
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
                        <CloudinaryUploadWidget 
                            onSuccess={handleUploadSuccess}
                            isUploading={isUploading}
                            setIsUploading={setIsUploading}
                        >
                             <Button variant="outline">
                                Upload Logo
                            </Button>
                        </CloudinaryUploadWidget>
                        <p className="text-xs text-muted-foreground">Click the button to upload a new logo. (PNG, JPG)</p>
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
                    <Input 
                        id="companyName" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Tech Solutions Inc."
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="companyWebsite">Company Website</Label>
                    <Input 
                        id="companyWebsite" 
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="e.g. https://example.com"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="recruiterBio">Company Bio</Label>
                    <Textarea 
                        id="recruiterBio" 
                        rows={4} 
                        value={companyBio}
                        onChange={(e) => setCompanyBio(e.target.value)}
                        placeholder="e.g. Tech Solutions Inc. is a leading provider of innovative technology solutions..."
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
        </Card>
    );
}
