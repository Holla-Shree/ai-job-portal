
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import withAuth from '@/components/withAuth';
import { useNotifications, ApplicationNotification, Job } from '@/contexts/NotificationContext';
import { ArrowLeft, Star, Briefcase, Building, Clock, MapPin, Trash2, Eye, FileText, Calendar, TrendingUp, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';

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

const JobCard = ({ application, jobDetails, onCardClick }: { application: ApplicationNotification, jobDetails?: Job, onCardClick: () => void }) => {
    const { toast } = useToast();
    const { addNotification, unsaveJob, updateApplicationStatus } = useNotifications();

    const handleApply = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!jobDetails) return;
        addNotification(jobDetails.title, jobDetails.company);
        toast({
            title: "Application Submitted!",
            description: `Your application for the ${jobDetails.title} role at ${jobDetails.company} has been sent.`,
        });
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!jobDetails) return;
        unsaveJob(jobDetails.id);
        toast({
            title: "Job Removed",
            description: `Removed ${jobDetails.title} from your pipeline.`
        })
    }

    const handleWithdraw = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!jobDetails) return;
        // This is a "soft delete" or a status change to a withdrawn state.
        // For simplicity, we'll just remove it from active applications.
        unsaveJob(jobDetails.id); 
         toast({
            title: "Application Withdrawn",
            description: `You have withdrawn your application for ${jobDetails.title}.`
        })
    }
    
    return (
        <Card 
            className="mb-4 bg-card/80 backdrop-blur-sm shadow-md hover:shadow-lg hover:border-primary/50 transition-all duration-300 group flex flex-col cursor-pointer"
            onClick={onCardClick}
        >
            <CardHeader className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">{application.jobTitle}</CardTitle>
                </div>
                <CardDescription className="text-xs flex items-center gap-1.5"><Building className="h-3 w-3" />{application.company}</CardDescription>
                 {jobDetails && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs pt-1 text-muted-foreground">
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {jobDetails.city}</div>
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {jobDetails.type}</div>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                 {jobDetails?.salary && <p className="font-medium text-primary mb-2">{jobDetails.salary}</p>}
                 <p>Updated {formatDistanceToNow(new Date(application.timestamp), { addSuffix: true })}</p>
            </CardContent>
             {application.status === 'Interested' && jobDetails && (
                <CardFooter className="p-4 pt-0">
                     <div className="flex gap-2 w-full">
                        <Button size="sm" className="flex-1" onClick={handleApply}>
                            <Briefcase className="mr-2 h-4 w-4" /> Apply
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="flex-1" onClick={(e) => e.stopPropagation()}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                                </Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
                </CardFooter>
            )}
             {application.status === 'Applied' && jobDetails && (
                <CardFooter className="p-4 pt-0">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button size="sm" variant="outline" className="w-full" onClick={(e) => e.stopPropagation()}>
                                <X className="mr-2 h-4 w-4" /> Withdraw Application
                            </Button>
                        </AlertDialogTrigger>
                         <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Withdraw Application?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to withdraw your application for the {jobDetails.title} position? This may not be reversible.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleWithdraw} className="bg-destructive hover:bg-destructive/90">Confirm Withdraw</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            )}
        </Card>
    )
}


function ApplicationPipelinePage() {
    const { applicationHistory, setApplicationHistory, jobs } = useNotifications();
    const { user } = useAuth();
    const [isClient, setIsClient] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<ApplicationNotification | null>(null);

    useEffect(() => {
        setIsClient(true);
        if (user?.id && user.role === 'user') {
            const applicationsQuery = query(collection(db, "applications"), where("candidateId", "==", user.id));
            const unsubscribeApps = onSnapshot(applicationsQuery, (snapshot) => {
                const appsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApplicationNotification));
                setApplicationHistory(appsData);
            });

            return () => {
                unsubscribeApps();
            };
        }
    }, [user, setApplicationHistory]);

    const applicationsByStatus = useMemo(() => {
        const grouped = {} as Record<StatusColumn, ApplicationNotification[]>;
        columns.forEach(col => grouped[col] = []);

        applicationHistory.forEach(app => {
            if (grouped[app.status]) {
                grouped[app.status].push(app);
            }
        });
        
        for (const col in grouped) {
            grouped[col as StatusColumn].sort((a,b) => b.timestamp - a.timestamp);
        }

        return grouped;
    }, [applicationHistory]);

    const selectedJobDetails = useMemo(() => {
        if (!selectedApplication) return null;
        return jobs.find(job => job.id === selectedApplication.jobId);
    }, [selectedApplication, jobs]);
    
    const applicationHistoryForSelected = useMemo(() => {
        if (!selectedApplication) return [];
        // This is a mock history. In a real app, you'd store status changes as separate events.
        const history = [
            { status: 'Interested', date: new Date(selectedApplication.timestamp - 4 * 24 * 60 * 60 * 1000) },
            { status: 'Applied', date: new Date(selectedApplication.timestamp - 2 * 24 * 60 * 60 * 1000) },
            { status: 'Under Review', date: new Date(selectedApplication.timestamp - 1 * 24 * 60 * 60 * 1000) },
            { status: 'Interview', date: new Date(selectedApplication.timestamp) },
        ];
        const statuses = ['Interested', 'Applied', 'Under Review', 'Interview', 'Offer', 'Rejected'];
        const currentIndex = statuses.indexOf(selectedApplication.status);
        return history.slice(0, currentIndex + 1);
    }, [selectedApplication]);
    
    if (!isClient) return null;


    return (
        <>
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
                            <div key={status} className="w-80 flex-shrink-0 bg-muted/50 rounded-xl">
                                <div className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10 p-4 rounded-t-xl">
                                    <h2 className="font-semibold flex items-center gap-2">
                                         <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
                                        <span className="text-sm font-normal text-muted-foreground">({applicationsByStatus[status].length})</span>
                                    </h2>
                                </div>
                                <ScrollArea className="h-[calc(100vh-22rem)]">
                                    <div className="px-4 pt-2 pb-4">
                                        {applicationsByStatus[status].length > 0 ? (
                                            applicationsByStatus[status].map(app => {
                                                const jobDetails = jobs.find(job => job.id === app.jobId);
                                                return <JobCard key={app.id} application={app} jobDetails={jobDetails} onCardClick={() => setSelectedApplication(app)} />
                                            })
                                        ) : (
                                            <div className="text-center text-sm text-muted-foreground pt-10 px-4">
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

            <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Application Details</DialogTitle>
                        {selectedJobDetails && (
                            <DialogDescription>
                                Details for your application to {selectedJobDetails.title} at {selectedJobDetails.company}.
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    {selectedApplication && selectedJobDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 max-h-[70vh] overflow-y-auto">
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="font-semibold">Job Description</h3>
                                <ScrollArea className="h-60 rounded-md border p-4">
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {selectedJobDetails.description}
                                    </p>
                                </ScrollArea>
                                 <div>
                                    <h3 className="font-semibold mb-2">Qualifications</h3>
                                    <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                                        <li>Bachelor's degree in Computer Science or related field.</li>
                                        <li>3+ years of experience in a similar role.</li>
                                        <li>Proficiency in relevant technologies.</li>
                                        <li>Strong problem-solving skills.</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="md:col-span-1 space-y-4">
                                <h3 className="font-semibold">Application Status</h3>
                                <div className="space-y-4">
                                    {applicationHistoryForSelected.map((event, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                             <div className="flex flex-col items-center">
                                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                                    <TrendingUp className="h-3 w-3" />
                                                </div>
                                                {index < applicationHistoryForSelected.length - 1 && <div className="w-px h-8 bg-border" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{event.status}</p>
                                                <p className="text-xs text-muted-foreground">{format(event.date, 'MMM d, yyyy')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export default withAuth(ApplicationPipelinePage, ['user', 'admin']);
