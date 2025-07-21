
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function PrivacySettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control how your information is shared.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <Label htmlFor="profile-visibility" className="flex flex-col space-y-1">
                        <span>Profile Visibility</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            Allow recruiters to see your anonymized profile.
                        </span>
                    </Label>
                    <Switch id="profile-visibility" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="job-search-status" className="flex flex-col space-y-1">
                        <span>Job Search Status</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            Let recruiters know you are open to new opportunities.
                        </span>
                    </Label>
                    <Switch id="job-search-status" defaultChecked />
                </div>
            </CardContent>
        </Card>
    );
}
