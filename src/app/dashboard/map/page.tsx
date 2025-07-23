

'use client';
import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Briefcase, Building, MapPin, LocateFixed, Clock, ArrowLeft, MessageSquare, Bookmark } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import GoogleMapsProvider from '@/components/GoogleMapsProvider';
import withAuth from '@/components/withAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useNotifications, Job } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function JobDetails({ job, onBack }: { job: Job; onBack: () => void; }) {
    const { toast } = useToast();
    const { addNotification, initiateConversation, savedJobs, saveJob, unsaveJob } = useNotifications();
    const { user } = useAuth();
    const router = useRouter();

    const isSaved = savedJobs.includes(job.id);

    const handleApply = () => {
        if (!user) {
            router.push('/login?redirect=/dashboard/map');
            toast({ title: 'Please log in to apply', variant: 'destructive' });
            return;
        }
        addNotification(job.title, job.company);
        toast({
            title: "Application Submitted!",
            description: `Your application for the ${job.title} role at ${job.company} has been sent.`,
        });
    };

    const handleMessageRecruiter = () => {
         if (!user) {
            router.push('/login?redirect=/dashboard/map');
            toast({ title: 'Please log in to message recruiters', variant: 'destructive' });
            return;
        }
        const conversationId = initiateConversation({
            jobTitle: job.title,
            company: job.company,
            partnerName: `Recruiter @ ${job.company}`
        });
        router.push(`/dashboard/messaging?open=${conversationId}`);
    }

    const handleToggleSave = () => {
        if (!user) {
            router.push('/login?redirect=/dashboard/map');
            toast({ title: 'Please log in to save jobs', variant: 'destructive' });
            return;
        }
        if (isSaved) {
            unsaveJob(job.id);
            toast({ title: 'Job Unsaved' });
        } else {
            saveJob(job.id);
            toast({ title: 'Job Saved!' });
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
                </Button>
                <div className="flex items-center gap-4">
                    <Image src="https://placehold.co/64x64.png" alt={job.company} width={64} height={64} className="rounded-md" data-ai-hint="company logo" />
                    <div>
                        <h2 className="font-headline text-xl font-semibold">{job.title}</h2>
                        <p className="text-sm text-muted-foreground">{job.company} &middot; {job.city}</p>
                    </div>
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4 text-sm">
                    <div className="flex items-center gap-4">
                        <Badge variant="secondary">{job.type}</Badge>
                        <Badge variant="secondary">{job.domain}</Badge>
                        <p className="font-semibold text-primary">{job.salary}</p>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-2">Job Description</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Key Responsibilities</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>Develop and maintain web applications.</li>
                            <li>Collaborate with cross-functional teams.</li>
                            <li>Write clean, maintainable, and efficient code.</li>
                            <li>Participate in code reviews and design discussions.</li>
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">Qualifications</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>Bachelor's degree in Computer Science or related field.</li>
                            <li>3+ years of experience in a similar role.</li>
                            <li>Proficiency in relevant technologies.</li>
                            <li>Strong problem-solving skills.</li>
                        </ul>
                    </div>
                </div>
            </ScrollArea>
             <div className="p-4 border-t mt-auto flex items-center gap-2">
                <Button className="w-full" onClick={handleApply}>Apply Now</Button>
                <Button variant="outline" className="w-full" onClick={handleMessageRecruiter}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Message Recruiter
                </Button>
                <Button variant="outline" size="lg" className="px-3" onClick={handleToggleSave} title={isSaved ? "Unsave Job" : "Save Job"}>
                    <Bookmark className={cn("h-6 w-6", isSaved && "fill-primary text-primary")} />
                </Button>
            </div>
        </div>
    )
}

function JobMapPage() {
    const defaultPosition = { lat: 20.5937, lng: 78.9629 }; // Centered on India
    const { jobs } = useNotifications();
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
    const jobListRef = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (selectedJob && jobListRef.current[selectedJob.id]) {
            jobListRef.current[selectedJob.id]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [selectedJob]);


    return (
        <GoogleMapsProvider>
            <div className="h-full grid grid-cols-1 md:grid-cols-2">
                {/* Job Search Panel / Details Panel */}
                <div className="md:col-span-1 bg-background h-full flex flex-col">
                    {selectedJob ? (
                        <JobDetails job={selectedJob} onBack={() => setSelectedJob(null)} />
                    ) : (
                        <>
                            <div className="p-4 border-b">
                                <h2 className="font-headline text-xl font-semibold flex items-center"><Search className="mr-2 h-5 w-5" /> Find Jobs</h2>
                                <p className="text-sm text-muted-foreground">Explore opportunities on the map.</p>
                            </div>
                            <div className="p-4 space-y-4">
                               <Input placeholder="Job title, keyword, or company" className="bg-muted border-0" />
                               <Input placeholder="City, state, or remote" className="bg-muted border-0" />
                                <div className="grid grid-cols-2 gap-2">
                                     <Select>
                                        <SelectTrigger className="bg-muted border-0"><SelectValue placeholder="Job Type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full-time">Full-time</SelectItem>
                                            <SelectItem value="part-time">Part-time</SelectItem>
                                            <SelectItem value="contract">Contract</SelectItem>
                                            <SelectItem value="remote">Remote</SelectItem>
                                            <SelectItem value="internship">Internship</SelectItem>
                                        </SelectContent>
                                    </Select>
                                     <Select>
                                        <SelectTrigger className="bg-muted border-0"><SelectValue placeholder="Domain" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tech">Tech</SelectItem>
                                            <SelectItem value="fintech">Fintech</SelectItem>
                                            <SelectItem value="healthcare">Healthcare</SelectItem>
                                            <SelectItem value="ecommerce">E-commerce</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full">
                                    <Search className="mr-2 h-4 w-4" /> Search Jobs
                                </Button>
                            </div>
                            <Separator />
                            <ScrollArea className="flex-1">
                                <div className="p-2 space-y-2">
                                    {jobs.filter(job => job.position?.lat && job.position?.lng).map(job => (
                                        <div
                                            key={job.id}
                                            ref={el => jobListRef.current[job.id] = el}
                                            className={cn(
                                                "p-3 rounded-lg cursor-pointer transition-all duration-200 border-2",
                                                hoveredJobId === job.id ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50 border-transparent',
                                                selectedJob?.id === job.id && 'bg-primary/10 border-primary'
                                            )}
                                            onClick={() => setSelectedJob(job)}
                                            onMouseEnter={() => setHoveredJobId(job.id)}
                                            onMouseLeave={() => setHoveredJobId(null)}
                                        >
                                            <h3 className="font-bold text-sm">{job.title}</h3>
                                            <p className="text-xs text-muted-foreground">{job.company}</p>
                                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.city}</div>
                                                <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.type}</div>
                                            </div>
                                            <div className="mt-2 flex gap-1">
                                                <Badge variant="outline">{job.domain}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </div>

                {/* Map Area */}
                <div className="md:col-span-1 h-[50vh] md:h-full relative">
                     <Map
                        defaultCenter={defaultPosition}
                        defaultZoom={5}
                        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        className="h-full w-full"
                    >
                        {jobs.filter(job => job.position?.lat && job.position?.lng).map((job) => (
                             <AdvancedMarker
                                key={job.id}
                                position={job.position}
                                onClick={() => setSelectedJob(job)}
                            >
                               <div className={cn(
                                   "transition-all duration-200",
                                   (selectedJob?.id === job.id || hoveredJobId === job.id) ? 'scale-125 z-10' : 'scale-100'
                                )}>
                                    <div className={cn(
                                        "rounded-full h-8 w-8 flex items-center justify-center shadow-lg",
                                        selectedJob?.id === job.id ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'
                                    )}>
                                       <Briefcase className="h-4 w-4"/>
                                    </div>
                                    <div className="bg-background w-2 h-2 transform rotate-45 -mt-1 mx-auto shadow-lg"></div>
                               </div>
                            </AdvancedMarker>
                        ))}
                    </Map>

                    <div className="absolute top-4 right-4">
                        <Button variant="outline" size="icon" className="bg-background shadow-lg">
                           <LocateFixed className="h-5 w-5" />
                           <span className="sr-only">Recenter</span>
                        </Button>
                    </div>
                </div>
            </div>
        </GoogleMapsProvider>
    );
}

export default withAuth(JobMapPage, ['user', 'recruiter', 'admin']);
