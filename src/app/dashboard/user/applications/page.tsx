
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import withAuth from '@/components/withAuth';
import { useNotifications, ApplicationNotification, Job } from '@/contexts/NotificationContext';
import { ArrowLeft, GripVertical, Star, Briefcase, Building, Clock, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type StatusColumn = 'Interested' | 'Applied' | 'Under Review' | 'Interview' | 'Offer' | 'Rejected';

const columns: StatusColumn[] = ['Interested', 'Applied', 'Under Review', 'Interview', 'Offer', 'Rejected'];

const getStatusBadgeVariant = (status: ApplicationNotification['status']) => {
    switch (status) {
        case 'Interested': return 'outline';
        case 'Applied': return 'secondary';
        case 'Under Review': return 'default';
        case 'Interview': return 'default';
        case 'Offer': return 'default';
        case 'Rejected': return 'destructive';
        default: return 'outline';
    }
};

const JobCard = ({ application, jobDetails }: { application: ApplicationNotification, jobDetails?: Job }) => {
    const { toast } = useToast();
    const { addNotification, unsaveJob } = useNotifications();

    const handleApply = () => {
        if (!jobDetails) return;
        addNotification(jobDetails.title, jobDetails.company);
        toast({
            title: "Application Submitted!",
            description: `Your application for the ${jobDetails.title} role at ${jobDetails.company} has been sent.`,
        });
    };

    const handleRemove = () => {
        if (!jobDetails) return;
        unsaveJob(jobDetails.id); // unsaveJob now deletes the 'Interested' application
        toast({
            title: "Job Removed",
            description: `Removed ${jobDetails.title} from your pipeline.`
        })
    }
    
    return (
        <Card className="mb-4 bg-card/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-300 group">
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold">{application.jobTitle}</CardTitle>
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                </div>
                <CardDescription className="text-xs">{application.company}</CardDescription>
                 {jobDetails && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs pt-1 text-muted-foreground">
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {jobDetails.city}</div>
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {jobDetails.type}</div>
                    </div>
                )}
            </CardHeader>
             {application.status === 'Interested' && jobDetails && (
                <CardContent className="p-4 pt-0">
                     <div className="flex gap-2">
                        <Button size="sm" className="w-full" onClick={handleApply}>
                            <Briefcase className="mr-2 h-4 w-4" /> Apply Now
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive w-full">Remove</Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Remove this job?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will remove "{jobDetails.title}" from your "Interested" list. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRemove} className="bg-destructive hover:bg-destructive/90">Confirm</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}


function ApplicationPipelinePage() {
    const { applicationHistory, jobs } = useNotifications();
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const applicationsByStatus = useMemo(() => {
        const grouped = {} as Record<StatusColumn, ApplicationNotification[]>;
        columns.forEach(col => grouped[col] = []);

        applicationHistory.forEach(app => {
            if (grouped[app.status]) {
                grouped[app.status].push(app);
            }
        });
        
        // Sort each column by timestamp
        for (const col in grouped) {
            grouped[col as StatusColumn].sort((a,b) => b.timestamp - a.timestamp);
        }

        return grouped;
    }, [applicationHistory]);

    if (!isClient) return null;

    return (
        <div className="h-full flex flex-col">
            <div className="container mx-auto py-8">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/dashboard/user">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <div className="mb-8">
                     <h1 className="font-headline text-3xl font-bold">My Application Pipeline</h1>
                     <p className="text-muted-foreground">Track your job applications from interest to offer.</p>
                </div>
            </div>

            <ScrollArea className="flex-1 px-8" orientation="horizontal">
                <div className="flex gap-6 pb-8 h-full">
                    {columns.map(status => (
                        <div key={status} className="w-72 flex-shrink-0">
                            <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2">
                                <h2 className="font-semibold flex items-center gap-2">
                                     <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
                                    <span className="text-sm font-normal text-muted-foreground">({applicationsByStatus[status].length})</span>
                                </h2>
                            </div>
                            <ScrollArea className="h-[calc(100vh-20rem)] pr-3 -mr-3">
                                <div className="pt-4">
                                    {applicationsByStatus[status].length > 0 ? (
                                        applicationsByStatus[status].map(app => {
                                            const jobDetails = jobs.find(job => job.title === app.jobTitle && job.company === app.company);
                                            return <JobCard key={app.id} application={app} jobDetails={jobDetails} />
                                        })
                                    ) : (
                                        <div className="text-center text-sm text-muted-foreground pt-10">
                                            <p>No jobs in this stage.</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

export default withAuth(ApplicationPipelinePage, ['user', 'admin']);
