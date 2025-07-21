
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AccountSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your recruiter account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-medium">Export Your Data</h3>
                    <p className="text-sm text-muted-foreground mb-2">Download a copy of your posted jobs and candidate data.</p>
                    <Button variant="outline">Export Data</Button>
                </div>
                 <div>
                    <h3 className="font-medium text-destructive">Delete Account</h3>
                    <p className="text-sm text-muted-foreground mb-2">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <Button variant="destructive">Delete My Account</Button>
                </div>
            </CardContent>
        </Card>
    );
}
