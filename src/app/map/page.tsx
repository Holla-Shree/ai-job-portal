
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Briefcase, Building, MapPin, LocateFixed, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import GoogleMapsProvider from '@/components/GoogleMapsProvider';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const mockJobs = [
  { id: 1, title: "Senior Backend Engineer", company: "TekSystems India", city: "Mumbai", position: { lat: 19.0760, lng: 72.8777 }, type: "Full-time", domain: "Tech", salary: "₹20-25 LPA" },
  { id: 2, title: "Data Scientist", company: "Google", city: "Bengaluru", position: { lat: 12.9716, lng: 77.5946 }, type: "Full-time", domain: "Tech", salary: "₹22-28 LPA" },
  { id: 3, title: "Junior Frontend Developer", company: "Freshworks", city: "Chennai", position: { lat: 13.0827, lng: 80.2707 }, type: "Full-time", domain: "Tech", salary: "₹8-12 LPA" },
  { id: 4, title: "Product Manager", company: "PhonePe", city: "Bengaluru", position: { lat: 12.9268, lng: 77.6262 }, type: "Full-time", domain: "Fintech", salary: "₹30-35 LPA" },
  { id: 5, title: "Marketing Manager", company: "Zomato", city: "Gurugram", position: { lat: 28.4595, lng: 77.0266 }, type: "Full-time", domain: "Food Tech", salary: "₹15-20 LPA" },
  { id: 6, title: "Remote React Developer", company: "Toptal", city: "Remote", position: { lat: 28.6139, lng: 77.2090 }, type: "Remote", domain: "Tech", salary: "$70-90k USD" },
];

type Job = typeof mockJobs[0];

export default function JobMapPage() {
    const defaultPosition = { lat: 20.5937, lng: 78.9629 }; // Centered on India
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [hoveredJobId, setHoveredJobId] = useState<number | null>(null);
    const jobListRef = useRef<Record<number, HTMLDivElement | null>>({});

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
            <div className="flex flex-col h-screen">
                <AppHeader />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
                     {/* Job Search Panel */}
                    <div className="md:col-span-1 lg:col-span-1 bg-background h-full flex flex-col">
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
                                {mockJobs.map(job => (
                                    <div
                                        key={job.id}
                                        ref={el => jobListRef.current[job.id] = el}
                                        className={cn(
                                            "p-3 rounded-lg cursor-pointer transition-all duration-200 border-2",
                                            selectedJob?.id === job.id ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50 border-transparent'
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
                    </div>

                    {/* Map Area */}
                    <div className="md:col-span-2 lg:col-span-3 h-[50vh] md:h-full relative">
                         <Map
                            defaultCenter={defaultPosition}
                            defaultZoom={5}
                            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
                            gestureHandling={'greedy'}
                            disableDefaultUI={true}
                            className="h-full w-full"
                        >
                            {mockJobs.map((job) => (
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

                         {selectedJob && (
                            <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm shadow-2xl animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
                                <CardContent className="p-4 flex gap-4 items-center">
                                    <Image src="https://placehold.co/64x64.png" alt={selectedJob.company} width={64} height={64} className="rounded-md" data-ai-hint="company logo" />
                                    <div className="flex-1">
                                        <h3 className="font-bold">{selectedJob.title}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedJob.company}</p>
                                        <p className="text-sm font-semibold text-primary mt-1">{selectedJob.salary}</p>
                                    </div>
                                    <Button size="sm">Apply</Button>
                                </CardContent>
                            </Card>
                        )}

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
