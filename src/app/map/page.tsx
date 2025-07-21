
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Briefcase, Building, MapPin, LocateFixed, Clock, ArrowLeft } from 'lucide-react';
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
  { id: 1, title: "Senior Backend Engineer", company: "TekSystems India", city: "Mumbai", position: { lat: 19.0760, lng: 72.8777 }, type: "Full-time", domain: "Tech", salary: "₹20-25 LPA", description: "Design, build, and maintain scalable and reliable backend services. You will work with a team of talented engineers to develop new features and improve existing ones. The ideal candidate has strong experience with Node.js, microservices, and cloud platforms like AWS or GCP." },
  { id: 2, title: "Data Scientist", company: "Google", city: "Bengaluru", position: { lat: 12.9716, lng: 77.5946 }, type: "Full-time", domain: "Tech", salary: "₹22-28 LPA", description: "Apply your expertise in quantitative analysis, data mining, and the presentation of data to see beyond the numbers and understand how our users interact with our products. You will work on projects that have a direct impact on our business and users. Proficiency in Python, R, and SQL is required." },
  { id: 3, title: "Junior Frontend Developer", company: "Freshworks", city: "Chennai", position: { lat: 13.0827, lng: 80.2707 }, type: "Full-time", domain: "Tech", salary: "₹8-12 LPA", description: "We are looking for a passionate Junior Frontend Developer to join our team. You will be responsible for building and maintaining our web applications using modern technologies like React and TypeScript. This is a great opportunity to learn and grow in a fast-paced environment." },
  { id: 4, title: "Product Manager", company: "PhonePe", city: "Bengaluru", position: { lat: 12.9268, lng: 77.6262 }, type: "Full-time", domain: "Fintech", salary: "₹30-35 LPA", description: "As a Product Manager, you will be responsible for the product planning and execution throughout the Product Lifecycle, including: gathering and prioritizing product and customer requirements, defining the product vision, and working closely with engineering, sales, marketing and support to ensure revenue and customer satisfaction goals are met." },
  { id: 5, title: "Marketing Manager", company: "Zomato", city: "Gurugram", position: { lat: 28.4595, lng: 77.0266 }, type: "Full-time", domain: "Food Tech", salary: "₹15-20 LPA", description: "We're looking for an experienced and creative Marketing Manager to lead our marketing campaigns. You'll be responsible for developing, implementing and executing strategic marketing plans for an entire organization in order to attract potential customers and retain existing ones." },
  { id: 6, title: "Remote React Developer", company: "Toptal", city: "Remote", position: { lat: 28.6139, lng: 77.2090 }, type: "Remote", domain: "Tech", salary: "$70-90k USD", description: "Join a network of the world's top talent in design, business, and technology. As a React Developer, you will work on challenging projects for leading companies. This is a remote position, so you can work from anywhere. Strong proficiency in React.js and its core principles is a must." },
];

type Job = typeof mockJobs[0];

function JobDetails({ job, onBack }: { job: Job; onBack: () => void; }) {
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
             <div className="p-4 border-t mt-auto">
                <Button className="w-full">Apply Now</Button>
            </div>
        </div>
    )
}

export default function JobMapPage() {
    const defaultPosition = { lat: 20.5937, lng: 78.9629 }; // Centered on India
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [hoveredJobId, setHoveredJobId] = useState<number | null>(null);
    const jobListRef = useRef<Record<number, HTMLDivElement | null>>({});

    useEffect(() => {
        if (selectedJob && jobListRef.current[selectedJob.id] && !selectedJob) {
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
                                        {mockJobs.map(job => (
                                            <div
                                                key={job.id}
                                                ref={el => jobListRef.current[job.id] = el}
                                                className={cn(
                                                    "p-3 rounded-lg cursor-pointer transition-all duration-200 border-2",
                                                    hoveredJobId === job.id ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50 border-transparent'
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
