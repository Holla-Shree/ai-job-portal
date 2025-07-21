
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export default function CommunicationSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Communication Preferences</CardTitle>
                <CardDescription>Manage how we communicate with you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                    <Checkbox id="job-alerts" defaultChecked />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="job-alerts"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Job Alerts
                        </label>
                        <p className="text-sm text-muted-foreground">
                            Receive emails about new jobs that match your profile.
                        </p>
                    </div>
                </div>
                <div className="flex items-start space-x-3">
                    <Checkbox id="application-updates" defaultChecked />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="application-updates"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Application Updates
                        </label>
                        <p className="text-sm text-muted-foreground">
                            Get notifications about the status of your job applications.
                        </p>
                    </div>
                </div>
                 <div className="flex items-start space-x-3">
                    <Checkbox id="newsletter" />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="newsletter"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Newsletter
                        </label>
                        <p className="text-sm text-muted-foreground">
                            Subscribe to our weekly newsletter with career tips.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
