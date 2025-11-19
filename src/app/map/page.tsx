

'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleMap, Map, Marker } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Briefcase, Building, MapPin, LocateFixed, Clock, ArrowLeft, MessageSquare, Bookmark, Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import GoogleMapsProvider from '@/components/GoogleMapsProvider';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useNotifications, Job, ApplicationNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

function JobDetails({ job, onBack, isInterested }: { job: Job; onBack: () => void; isInterested: boolean; }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const { addNotification, expressInterest, unsaveJob } = useNotifications();
    
    const handleApply = () => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please log in or sign up to apply for jobs.",
                variant: "destructive"
            });
            router.push('/login');
            return;
        }
        addNotification(job.title, job.company);
        toast({
            title: "Application Submitted!",
            description: `Your application for the ${job.title} role at ${job.company} has been sent.`,
        });
    };

    const handleToggleInterest = () => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please log in or sign up to express interest.",
                variant: "destructive"
            });
            router.push('/login');
            return;
        }
        if (isInterested) {
            unsaveJob(job.id);
            toast({ title: 'Removed from Interest List' });
        } else {
            expressInterest(job.title, job.company);
            toast({ title: 'Interest Expressed!' });
        }
    };
    
    const handleMessageRecruiter = () => {
        if (!user) {
            router.push('/login?redirect=/map');
            toast({ title: 'Please log in to message recruiters', variant: 'destructive' });
            return;
        }
        if (!job.recruiterId || !job.id) {
            toast({
                title: 'Cannot Message Recruiter',
                description: 'Recruiter information for this job is not available.',
                variant: 'destructive',
            });
            return;
        }
        router.push(`/dashboard/messaging?start_with_user=${job.recruiterId}&about_job_id=${job.id}`);
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
                 <Button className="w-full" variant="secondary" onClick={handleMessageRecruiter} disabled={!job.recruiterId}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Message Recruiter
                </Button>
                <Button variant="outline" className="h-10 p-2.5" onClick={handleToggleInterest}>
                    <Star className={cn("h-5 w-5", isInterested && "fill-amber-400 text-amber-400")} />
                    <span className="sr-only">Express Interest</span>
                </Button>
            </div>
        </div>
    )
}

export default function JobMapPage() {
    const defaultPosition = { lat: 20.5937, lng: 78.9629 }; // Centered on India
    const { jobs, applicationHistory } = useNotifications();
    const { user } = useAuth();
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
    const jobListRef = useRef<Record<string, HTMLDivElement | null>>({});

    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLocation, setSearchLocation] = useState('');
    const [searchType, setSearchType] = useState('all');
    const [searchDomain, setSearchDomain] = useState('all');

    const interestedJobIds = useMemo(() => {
        if (!user) return new Set();
        return new Set(
            applicationHistory
                .filter(app => app.candidateId === user.id && app.status === 'Interested' && app.jobId)
                .map(app => app.jobId)
        );
    }, [applicationHistory, user]);

    useEffect(() => {
        // Initially, show all jobs that have a valid position
        setFilteredJobs(jobs.filter(job => job.position?.lat && job.position?.lng));
    }, [jobs]);

    useEffect(() => {
        if (selectedJob && jobListRef.current[selectedJob.id]) {
            jobListRef.current[selectedJob.id]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [selectedJob]);
    
     const handleSearch = () => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const lowerCaseLocation = searchLocation.toLowerCase();

        const results = jobs.filter(job => {
            const matchesQuery = lowerCaseQuery ? 
                job.title.toLowerCase().includes(lowerCaseQuery) || 
                job.company.toLowerCase().includes(lowerCaseQuery) ||
                job.description.toLowerCase().includes(lowerCaseQuery) : true;
            
            const matchesLocation = lowerCaseLocation ? job.city.toLowerCase().includes(lowerCaseLocation) : true;
            const matchesType = searchType !== 'all' ? job.type === searchType : true;
            const matchesDomain = searchDomain !== 'all' ? job.domain === searchDomain : true;

            return job.position?.lat && job.position?.lng && matchesQuery && matchesLocation && matchesType && matchesDomain;
        });

        setFilteredJobs(results);
        setSelectedJob(null); // Deselect any job when search is performed
    };

    return (
        <GoogleMapsProvider>
            <div className="flex flex-col h-screen">
                <AppHeader />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
                     {/* Job Search Panel */}
                    <div className="md:col-span-1 bg-background h-full flex flex-col">
                        {selectedJob ? (
                            <JobDetails 
                                job={selectedJob} 
                                onBack={() => setSelectedJob(null)}
                                isInterested={interestedJobIds.has(selectedJob.id)}
                             />
                        ) : (
                            <>
                                <div className="p-4 border-b">
                                    <h2 className="font-headline text-xl font-semibold flex items-center"><Search className="mr-2 h-5 w-5" /> Find Jobs</h2>
                                    <p className="text-sm text-muted-foreground">Explore opportunities on the map.</p>
                                </div>
                                <div className="p-4 space-y-4">
                                   <Input 
                                       placeholder="Job title, keyword, or company" 
                                       className="bg-muted border-0"
                                       value={searchQuery}
                                       onChange={(e) => setSearchQuery(e.target.value)}
                                   />
                                   <Input 
                                       placeholder="City, state, or remote" 
                                       className="bg-muted border-0"
                                       value={searchLocation}
                                       onChange={(e) => setSearchLocation(e.target.value)}
                                   />
                                    <div className="grid grid-cols-2 gap-2">
                                         <Select value={searchType} onValueChange={setSearchType}>
                                            <SelectTrigger className="bg-muted border-0"><SelectValue placeholder="Job Type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="Full-time">Full-time</SelectItem>
                                                <SelectItem value="Part-time">Part-time</SelectItem>
                                                <SelectItem value="Contract">Contract</SelectItem>
                                                <SelectItem value="Remote">Remote</SelectItem>
                                                <SelectItem value="Internship">Internship</SelectItem>
                                            </SelectContent>
                                        </Select>
                                         <Select value={searchDomain} onValueChange={setSearchDomain}>
                                            <SelectTrigger className="bg-muted border-0"><SelectValue placeholder="Domain" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Domains</SelectItem>
                                                <SelectItem value="Tech">Tech</SelectItem>
                                                <SelectItem value="Fintech">Fintech</SelectItem>
                                                <SelectItem value="Healthcare">Healthcare</SelectItem>
                                                <SelectItem value="E-commerce">E-commerce</SelectItem>
                                                <SelectItem value="Design">Design</SelectItem>
                                                <SelectItem value="Marketing">Marketing</SelectItem>
                                                <SelectItem value="HR">HR</SelectItem>
                                                <SelectItem value="Finance">Finance</SelectItem>
                                                <SelectItem value="Support">Support</SelectItem>
                                                <SelectItem value="Content">Content</SelectItem>
                                                <SelectItem value="Business">Business</SelectItem>
                                                <SelectItem value="Security">Security</SelectItem>
                                                <SelectItem value="Sales">Sales</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button className="w-full" onClick={handleSearch}>
                                        <Search className="mr-2 h-4 w-4" /> Search Jobs
                                    </Button>
                                </div>
                                <Separator />
                                <ScrollArea className="flex-1">
                                    <div className="p-2 space-y-2">
                                        {filteredJobs.length > 0 ? filteredJobs.map(job => (
                                            <div
                                                key={job.id}
                                                ref={el => jobListRef.current[job.id] = el}
                                                className={cn(
                                                    "p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 relative",
                                                    hoveredJobId === job.id ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50 border-transparent',
                                                    selectedJob?.id === job.id && 'bg-primary/10 border-primary'
                                                )}
                                                onClick={() => setSelectedJob(job)}
                                                onMouseEnter={() => setHoveredJobId(job.id)}
                                                onMouseLeave={() => setHoveredJobId(null)}
                                            >
                                                {interestedJobIds.has(job.id) && <Star className="h-4 w-4 absolute top-3 right-3 text-amber-400 fill-amber-400" />}
                                                <h3 className="font-bold text-sm pr-6">{job.title}</h3>
                                                <p className="text-xs text-muted-foreground">{job.company}</p>
                                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.city}</div>
                                                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.type}</div>
                                                </div>
                                                <div className="mt-2 flex gap-1">
                                                    <Badge variant="outline">{job.domain}</Badge>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center text-muted-foreground p-8">
                                                <p>No jobs found matching your criteria.</p>
                                            </div>
                                        )}
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
                            gestureHandling={'greedy'}
                            disableDefaultUI={true}
                            className="h-full w-full"
                        >
                            {filteredJobs.map((job) => (
                                <Marker
                                    key={job.id}
                                    position={job.position as { lat: number, lng: number }}
                                    onClick={() => setSelectedJob(job)}
                                    title={job.title}
                                />
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
                <AppFooter />
            </div>
        </GoogleMapsProvider>
    );
}
