
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function RecruiterProfilePage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recruiter Profile</CardTitle>
                <CardDescription>Manage your personal and company information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" defaultValue="Recruiter Admin" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="recruiter@example.com" disabled />
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
