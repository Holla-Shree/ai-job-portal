'use client';
import React, { useState, useEffect } from 'react';
import { GoogleMapsProvider } from '@/components/GoogleMapsProvider';
import { Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Search, Building, DollarSign } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  position: { lat: number; lng: number };
  salary?: string;
  description?: string;
}

// Mock job data - replace with actual data fetching
const mockJobs: JobListing[] = [
  { id: '1', title: 'Software Engineer', company: 'Tech Corp', location: 'San Francisco, CA', position: { lat: 37.7749, lng: -122.4194 }, salary: '$120k - $150k', description: 'Develop awesome software.' },
  { id: '2', title: 'Product Manager', company: 'Innovate Ltd', location: 'New York, NY', position: { lat: 40.7128, lng: -74.0060 }, salary: '$130k - $160k', description: 'Manage innovative products.' },
  { id: '3', title: 'UX Designer', company: 'Creative Co', location: 'Austin, TX', position: { lat: 30.2672, lng: -97.7431 }, salary: '$100k - $130k', description: 'Design user-friendly interfaces.' },
  { id: '4', title: 'Data Scientist', company: 'Analytics Inc.', location: 'Chicago, IL', position: { lat: 41.8781, lng: -87.6298 }, description: 'Analyze complex datasets.' },
  { id: '5', title: 'Marketing Specialist', company: 'Growth Solutions', location: 'Boston, MA', position: { lat: 42.3601, lng: -71.0589 }, salary: '$90k - $110k', description: 'Drive marketing campaigns.' },
];

export default function JobMapPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<JobListing[]>(mockJobs);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Center of US
  const [zoom, setZoom] = useState(4);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => { // Simulate API call
      const lowerSearchTerm = searchTerm.toLowerCase();
      const results = mockJobs.filter(job =>
        job.title.toLowerCase().includes(lowerSearchTerm) ||
        job.company.toLowerCase().includes(lowerSearchTerm) ||
        job.location.toLowerCase().includes(lowerSearchTerm)
      );
      setFilteredJobs(results);
      if (results.length > 0) {
        // Optional: Recenter map if results are found, e.g., to the first result
        // setMapCenter(results[0].position);
        // setZoom(10);
      }
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleMarkerClick = (job: JobListing) => {
    setSelectedJob(job);
    setMapCenter(job.position);
    setZoom(12);
  };

  return (
    <GoogleMapsProvider>
      <div className="container mx-auto py-8 h-[calc(100vh-theme(spacing.24))] flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-1/3 shadow-xl flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Search className="mr-2 text-primary" />Search Jobs</CardTitle>
            <CardDescription>Find jobs by title, company, or location.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <div className="mb-4">
              <Input
                type="text"
                placeholder="e.g., Software Engineer, Remote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            {isLoading && (
              <div className="flex-grow flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {!isLoading && filteredJobs.length === 0 && (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground">No jobs found for your search.</p>
              </div>
            )}
            {!isLoading && filteredJobs.length > 0 && (
              <ScrollArea className="flex-grow">
                <div className="space-y-3 pr-3">
                  {filteredJobs.map((job) => (
                    <Card 
                      key={job.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${selectedJob?.id === job.id ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
                      onClick={() => handleMarkerClick(job)}
                      aria-pressed={selectedJob?.id === job.id}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleMarkerClick(job)}
                    >
                      <CardHeader className="p-3">
                        <CardTitle className="text-base font-semibold flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-accent shrink-0" /> {job.title}
                        </CardTitle>
                        <CardDescription className="text-xs flex items-center mt-1">
                          <Building className="w-3 h-3 mr-1.5 text-muted-foreground shrink-0" /> {job.company} - {job.location}
                        </CardDescription>
                        {job.salary && (
                           <CardDescription className="text-xs flex items-center mt-1">
                            <DollarSign className="w-3 h-3 mr-1.5 text-muted-foreground shrink-0" /> {job.salary}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="w-full md:w-2/3 h-[300px] md:h-full rounded-lg overflow-hidden shadow-xl border border-border">
          <Map
            defaultCenter={mapCenter}
            defaultZoom={zoom}
            center={mapCenter}
            zoom={zoom}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'JOBMATCH_AI_MAP'} // Optional: Use a Map ID for custom styling
            className="w-full h-full"
            onCenterChanged={(ev) => setMapCenter(ev.detail.center)}
            onZoomChanged={(ev) => setZoom(ev.detail.zoom)}
          >
            {filteredJobs.map((job) => (
              <AdvancedMarker
                key={job.id}
                position={job.position}
                onClick={() => handleMarkerClick(job)}
                title={`${job.title} at ${job.company}`}
              >
                <Pin 
                  background={selectedJob?.id === job.id ? 'var(--primary-hsl)' : 'var(--accent-hsl)'} // Use HSL vars from CSS
                  borderColor={selectedJob?.id === job.id ? 'var(--primary-hsl)' : 'var(--accent-hsl)'}
                  glyphColor={selectedJob?.id === job.id ? 'var(--primary-foreground-hsl)' : 'var(--accent-foreground-hsl)'}
                />
              </AdvancedMarker>
            ))}

            {selectedJob && (
              <InfoWindow
                position={selectedJob.position}
                onCloseClick={() => setSelectedJob(null)}
                pixelOffset={[0,-40]}
              >
                <Card className="w-64 shadow-none border-none">
                  <CardHeader className="p-3">
                    <CardTitle className="text-md font-semibold">{selectedJob.title}</CardTitle>
                    <CardDescription className="text-xs">{selectedJob.company} - {selectedJob.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 text-xs">
                    {selectedJob.description && <p className="mb-1">{selectedJob.description}</p>}
                    {selectedJob.salary && <p className="font-medium">Salary: {selectedJob.salary}</p>}
                    <Button size="xs" variant="link" className="p-0 h-auto mt-1 text-primary">View Details</Button>
                  </CardContent>
                </Card>
              </InfoWindow>
            )}
          </Map>
        </div>
      </div>
    </GoogleMapsProvider>
  );
}
