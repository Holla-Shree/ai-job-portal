
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/withAuth';
import { ArrowLeft } from 'lucide-react';

interface MessagingSettings {
    enableReadReceipts: boolean;
    allowMessagesFrom: 'anyone' | 'connections';
}

function MessagingSettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [settings, setSettings] = useState<MessagingSettings>({
        enableReadReceipts: true,
        allowMessagesFrom: 'anyone',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const savedSettings = localStorage.getItem('messagingSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleSettingChange = (key: keyof MessagingSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        setIsSaving(true);
        localStorage.setItem('messagingSettings', JSON.stringify(settings));
        setTimeout(() => {
            toast({
                title: 'Settings Saved',
                description: 'Your messaging preferences have been updated.',
            });
            setIsSaving(false);
            setHasChanges(false);
        }, 1000); // Simulate network delay
    };

    return (
        <div className="container mx-auto py-8">
             <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Messages
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Messaging Settings</CardTitle>
                    <CardDescription>Control your privacy and notification settings for messaging.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Privacy Settings */}
                    <div className="space-y-4">
                         <h3 className="text-lg font-semibold">Privacy</h3>
                         <div className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor="read-receipts" className="flex flex-col space-y-1">
                                <span>Enable Read Receipts</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Let others see when you have read their messages.
                                </span>
                            </Label>
                            <Switch 
                                id="read-receipts" 
                                checked={settings.enableReadReceipts}
                                onCheckedChange={(checked) => handleSettingChange('enableReadReceipts', checked)}
                            />
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Security</h3>
                         <div className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor="allow-messages" className="flex flex-col space-y-1">
                                <span>Allow Messages From</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Control who can send you messages.
                                </span>
                            </Label>
                             <Select 
                                value={settings.allowMessagesFrom}
                                onValueChange={(value) => handleSettingChange('allowMessagesFrom', value)}
                             >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="anyone">Anyone</SelectItem>
                                    <SelectItem value="connections">Connections Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


export default withAuth(MessagingSettingsPage, ['user', 'recruiter', 'admin']);
