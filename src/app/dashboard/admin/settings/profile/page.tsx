
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { CloudinaryUploadWidget } from '@/components/CloudinaryUploadWidget';
import { useNotifications } from '@/contexts/NotificationContext';


export default function AdminProfilePage() {
    const { user, updateUserAvatar } = useAuth();
    const { toast } = useToast();
    const { updateAdminProfile, admins } = useNotifications();
    
    const [name, setName] = useState('Admin');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const currentAdminProfile = React.useMemo(() => {
        return admins.find(a => a.id === user?.id);
    }, [admins, user]);
    
    useEffect(() => {
        if (currentAdminProfile) {
            setName(currentAdminProfile.name);
        } else if (user?.name) {
            setName(user.name);
        }
    }, [currentAdminProfile, user]);

    const handleUploadSuccess = async (result: any) => {
        const secureUrl = result?.info?.secure_url;
        if (secureUrl && user) {
            try {
                await updateUserAvatar(secureUrl);
                toast({
                    title: 'Profile Picture Updated',
                    description: 'Your new avatar has been saved.',
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
            await updateAdminProfile(user.id, { name });
            toast({
                title: 'Profile Saved',
                description: 'Your profile has been successfully updated.',
            });
        } catch (error) {
            console.error("Error saving admin profile:", error);
            toast({
                title: 'Save Failed',
                description: 'Could not save your profile changes.',
                variant: 'destructive',
             });
        } finally {
            setIsSaving(false);
        }
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Admin Profile</CardTitle>
                <CardDescription>Manage your administrator account information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user?.avatar} alt="Admin Avatar" data-ai-hint="person avatar" />
                            <AvatarFallback>A</AvatarFallback>
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
                                Upload Avatar
                            </Button>
                        </CloudinaryUploadWidget>
                        <p className="text-xs text-muted-foreground">Click the button to upload a new avatar. (PNG, JPG)</p>
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
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value="Administrator" disabled />
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
