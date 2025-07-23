

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import withAuth from '@/components/withAuth';
import { useNotifications, Job } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bookmark, MessageSquare, Briefcase, MapPin, Clock, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';


function SavedJobsPage() {
    const { jobs, unsaveJob, addNotification, initiateConversation } = useNotifications();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const savedJobsDetails = jobs.filter(job => user?.savedJobs.includes(job.id));

    const handleApply = (job: Job) => {
        addNotification(job.title, job.company);
        toast({
            title: "Application Submitted!",
            description: `Your application for the ${job.title} role at ${job.company} has been sent.`,
        });
    };
    
    const handleMessageRecruiter = (job: Job) => {
        const conversationId = initiateConversation({
            jobTitle: job.title,
            company: job.company,
            partnerName: `Recruiter @ ${job.company}`
        });
        const message = `Hi, I'm interested in the ${job.title} position I saved and had a few questions.`;
        router.push(`/dashboard/messaging?open=${conversationId}&message=${encodeURIComponent(message)}`);
    }

    const handleUnsave = (jobId: string) => {
        unsaveJob(jobId);
        toast({
            title: "Job Unsaved",
            description: "The job has been removed from your saved list."
        });
    }

    return (
        <div className="container mx-auto py-8">
            <Button asChild variant="ghost" className="mb-4">
                <Link href="/dashboard/user">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <Card className="shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-3">
                         <Bookmark className="h-8 w-8 text-primary" />
                         <div>
                            <CardTitle className="font-headline text-3xl">My Saved Jobs</CardTitle>
                            <CardDescription>Review the jobs you've saved for later.</CardDescription>
                         </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                    {savedJobsDetails.length > 0 ? (
                        savedJobsDetails.map(job => (
                            <Card key={job.id} className="group">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="font-headline text-xl">{job.title}</CardTitle>
                                            <CardDescription>{job.company}</CardDescription>
                                        </div>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive opacity-50 group-hover:opacity-100">
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Unsave this job?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will remove "{job.title}" from your saved jobs.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleUnsave(job.id)} className="bg-destructive hover:bg-destructive/90">Confirm</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm pt-2">
                                        <div className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" /> {job.city}</div>
                                        <div className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" /> {job.type}</div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                         <Badge variant="secondary">{job.domain}</Badge>
                                         <Badge variant="outline">{job.salary}</Badge>
                                    </div>
                                </CardHeader>
                                <CardFooter className="gap-2">
                                    <Button onClick={() => handleApply(job)} className="w-full">
                                        <Briefcase className="mr-2 h-4 w-4" /> Apply Now
                                    </Button>
                                    <Button variant="outline" className="w-full" onClick={() => handleMessageRecruiter(job)}>
                                        <MessageSquare className="mr-2 h-4 w-4" /> Message Recruiter
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center h-48 flex flex-col items-center justify-center text-muted-foreground">
                            <Bookmark className="h-12 w-12 mb-4" />
                            <p>You haven't saved any jobs yet.</p>
                            <p className="text-sm">Click the bookmark icon on a job to save it for later.</p>
                        </div>
                    )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default withAuth(SavedJobsPage, ['user']);
