
'use client';
import React, { useState } from 'react';
import { GoogleMap, APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Briefcase, Building } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import GoogleMapsProvider from '@/components/GoogleMapsProvider';
import withAuth from '@/components/withAuth';

const mockJobs = [
  { id: 1, title: "Senior Backend Engineer", company: "TekSystems India", position: { lat: 19.0760, lng: 72.8777 }, type: "Full-time", domain: "Tech" },
  { id: 2, title: "Data Scientist", company: "Google", position: { lat: 12.9716, lng: 77.5946 }, type: "Full-time", domain: "Tech" },
  { id: 3, title: "Junior Frontend Developer", company: "Freshworks", position: { lat: 13.0827, lng: 80.2707 }, type: "Full-time", domain: "Tech" },
  { id: 4, title: "Product Manager", company: "PhonePe", position: { lat: 12.9268, lng: 77.6262 }, type: "Full-time", domain: "Fintech" },
  { id: 5, title: "Marketing Manager", company: "Zomato", position: { lat: 28.5355, lng: 77.2249 }, type: "Full-time", domain: "Food Tech" },
  { id: 6, title: "Remote React Developer", company: "Toptal", position: { lat: 28.6139, lng: 77.2090 }, type: "Remote", domain: "Tech" },
];

function JobMapPage() {
    const defaultPosition = { lat: 20.5937, lng: 78.9629 }; // Centered on India
    const [selectedJob, setSelectedJob] = useState<typeof mockJobs[0] | null>(null);

    return (
        <GoogleMapsProvider>
            <div className="h-full flex flex-col md:flex-row">
                {/* Job Search Panel */}
                <Card className="w-full md:w-1/3 lg:w-1/4 shadow-lg rounded-none border-0 md:border-r h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center"><Search className="mr-2" /> Find Jobs</CardTitle>
                        <CardDescription>Explore opportunities on the map.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                        <div className="space-y-2">
                           <Input placeholder="Job title, keyword, or company" />
                           <Input placeholder="City, state, or remote" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <Select>
                                <SelectTrigger><SelectValue placeholder="Job Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full-time">Full-time</SelectItem>
                                    <SelectItem value="part-time">Part-time</SelectItem>
                                    <SelectItem value="contract">Contract</SelectItem>
                                    <SelectItem value="internship">Internship</SelectItem>
                                </SelectContent>
                            </Select>
                             <Select>
                                <SelectTrigger><SelectValue placeholder="Domain" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tech">Tech</SelectItem>
                                    <SelectItem value="fintech">Fintech</SelectItem>
                                    <SelectItem value="healthcare">Healthcare</SelectItem>
                                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {mockJobs.map(job => (
                                <Card key={job.id} className="cursor-pointer hover:bg-muted" onClick={() => setSelectedJob(job)}>
                                    <CardContent className="p-3">
                                        <h3 className="font-bold text-sm">{job.title}</h3>
                                        <p className="text-xs text-muted-foreground">{job.company}</p>
                                        <div className="mt-2 flex gap-1">
                                            <Badge variant={job.type === 'Remote' ? 'secondary' : 'outline'}>{job.type}</Badge>
                                            <Badge variant="outline">{job.domain}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Map Area */}
                <div className="flex-1 h-full">
                    <Map
                        defaultCenter={defaultPosition}
                        defaultZoom={5}
                        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                    >
                        {mockJobs.map((job) => (
                             <AdvancedMarker
                                key={job.id}
                                position={job.position}
                                onClick={() => setSelectedJob(job)}
                            >
                               <Pin />
                            </AdvancedMarker>
                        ))}

                        {selectedJob && (
                            <InfoWindow
                                position={selectedJob.position}
                                onCloseClick={() => setSelectedJob(null)}
                            >
                                <div className="p-2">
                                    <h3 className="font-bold text-base flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />{selectedJob.title}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Building className="h-4 w-4 text-primary" />{selectedJob.company}</p>
                                    <Button size="sm" className="mt-2 w-full">View Job</Button>
                                </div>
                            </InfoWindow>
                        )}
                    </Map>
                </div>
            </div>
        </GoogleMapsProvider>
    );
}

export default withAuth(JobMapPage, ['user', 'recruiter', 'admin']);
