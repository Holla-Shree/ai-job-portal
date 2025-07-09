
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

// Mock job data for Indian locations
const mockJobs: JobListing[] = [
  // Bengaluru
  { id: '1', title: 'Senior Backend Engineer', company: 'TekSystems India', location: 'Bengaluru, India', position: { lat: 12.9716, lng: 77.5946 }, salary: '₹25L - ₹40L', description: 'Building scalable backend services for our fintech platform.' },
  { id: '2', title: 'Data Scientist', company: 'Analytic Visions', location: 'Bengaluru, India', position: { lat: 12.9716, lng: 77.5946 }, salary: '₹18L - ₹30L', description: 'Leveraging ML models to derive business insights.' },
  { id: '3', title: 'Product Manager', company: 'InnovateHub', location: 'Bengaluru, India', position: { lat: 12.9716, lng: 77.5946 }, salary: '₹30L - ₹50L', description: 'Driving the product roadmap for our B2B SaaS product.' },
  { id: '4', title: 'DevOps Engineer', company: 'CloudNet', location: 'Bengaluru, India', position: { lat: 12.9716, lng: 77.5946 }, salary: '₹15L - ₹25L', description: 'Automating deployment and scaling infrastructure.' },
  { id: '5', title: 'UX/UI Designer', company: 'Pixel Perfect', location: 'Bengaluru, India', position: { lat: 12.9716, lng: 77.5946 }, salary: '₹12L - ₹22L', description: 'Creating beautiful and intuitive user experiences.' },
  // Mumbai
  { id: '6', title: 'Financial Analyst', company: 'Capital Growth', location: 'Mumbai, India', position: { lat: 19.0760, lng: 72.8777 }, salary: '₹15L - ₹28L', description: 'Market research and financial modeling.' },
  { id: '7', title: 'Full Stack Developer', company: 'CodeWave Tech', location: 'Mumbai, India', position: { lat: 19.0760, lng: 72.8777 }, salary: '₹14L - ₹24L', description: 'Developing web applications using MERN stack.' },
  { id: '8', title: 'Digital Marketing Head', company: 'BrandConnect', location: 'Mumbai, India', position: { lat: 19.0760, lng: 72.8777 }, salary: '₹20L - ₹35L', description: 'Leading all digital marketing campaigns.' },
  { id: '9', title: 'Mobile App Developer (Android)', company: 'Appify Solutions', location: 'Mumbai, India', position: { lat: 19.0760, lng: 72.8777 }, salary: '₹10L - ₹18L', description: 'Creating native Android applications.' },
  { id: '10', title: 'Investment Banker', company: 'Alpha Investments', location: 'Mumbai, India', position: { lat: 19.0760, lng: 72.8777 }, salary: '₹40L - ₹80L', description: 'Managing M&A and capital raising.' },
  // Delhi
  { id: '11', title: 'Cloud Architect', company: 'InfraSolutions', location: 'Delhi, India', position: { lat: 28.7041, lng: 77.1025 }, salary: '₹35L - ₹60L', description: 'Designing and implementing cloud strategies.' },
  { id: '12', title: 'Content Strategist', company: 'WordWeavers', location: 'Delhi, India', position: { lat: 28.7041, lng: 77.1025 }, salary: '₹8L - ₹15L', description: 'Developing content for marketing and branding.' },
  { id: '13', title: 'Business Development Manager', company: 'Growth Partners', location: 'Delhi, India', position: { lat: 28.7041, lng: 77.1025 }, salary: '₹12L - ₹20L', description: 'Identifying new business opportunities.' },
  { id: '14', title: 'AI/ML Engineer', company: 'Cognitive AI', location: 'Delhi, India', position: { lat: 28.7041, lng: 77.1025 }, salary: '₹20L - ₹32L', description: 'Building and deploying machine learning models.' },
  { id: '15', title: 'Cybersecurity Analyst', company: 'SecureNet', location: 'Delhi, India', position: { lat: 28.7041, lng: 77.1025 }, salary: '₹14L - ₹26L', description: 'Protecting company assets from cyber threats.' },
  // Hyderabad
  { id: '16', title: 'Game Developer', company: 'Playful Pixels', location: 'Hyderabad, India', position: { lat: 17.3850, lng: 78.4867 }, salary: '₹12L - ₹25L', description: 'Developing games for mobile and PC platforms.' },
  { id: '17', title: 'QA Automation Engineer', company: 'TestRight', location: 'Hyderabad, India', position: { lat: 17.3850, lng: 78.4867 }, salary: '₹10L - ₹18L', description: 'Creating automated test suites.' },
  { id: '18', title: 'Database Administrator', company: 'DataCore', location: 'Hyderabad, India', position: { lat: 17.3850, lng: 78.4867 }, salary: '₹15L - ₹25L', description: 'Managing and maintaining company databases.' },
  { id: '19', title: 'Frontend Developer (React)', company: 'WebWeavers', location: 'Hyderabad, India', position: { lat: 17.3850, lng: 78.4867 }, salary: '₹12L - ₹20L', description: 'Building responsive user interfaces with React.' },
  { id: '20', title: 'IT Project Manager', company: 'ProManage', location: 'Hyderabad, India', position: { lat: 17.3850, lng: 78.4867 }, salary: '₹22L - ₹35L', description: 'Overseeing IT projects from conception to completion.' },
  // Pune
  { id: '21', title: 'Automotive Engineer', company: 'AutoWorks', location: 'Pune, India', position: { lat: 18.5204, lng: 73.8567 }, salary: '₹10L - ₹18L', description: 'Designing and testing automotive components.' },
  { id: '22', title: 'Java Developer', company: 'Enterprise Solutions', location: 'Pune, India', position: { lat: 18.5204, lng: 73.8567 }, salary: '₹10L - ₹20L', description: 'Developing enterprise-level Java applications.' },
  { id: '23', title: 'HR Business Partner', company: 'PeopleFirst', location: 'Pune, India', position: { lat: 18.5204, lng: 73.8567 }, salary: '₹14L - ₹22L', description: 'Aligning HR strategies with business objectives.' },
  { id: '24', title: 'SAP Consultant', company: 'ERP Experts', location: 'Pune, India', position: { lat: 18.5204, lng: 73.8567 }, salary: '₹18L - ₹30L', description: 'Implementing and customizing SAP modules.' },
  { id: '25', title: 'Technical Writer', company: 'DocuCraft', location: 'Pune, India', position: { lat: 18.5204, lng: 73.8567 }, salary: '₹7L - ₹12L', description: 'Creating clear and concise technical documentation.' },
  // Chennai
  { id: '26', title: 'Embedded Systems Engineer', company: 'ChipDesign', location: 'Chennai, India', position: { lat: 13.0827, lng: 80.2707 }, salary: '₹12L - ₹22L', description: 'Working on firmware and hardware for IoT devices.' },
  { id: '27', title: 'SaaS Sales Specialist', company: 'CloudSell', location: 'Chennai, India', position: { lat: 13.0827, lng: 80.2707 }, salary: '₹9L - ₹16L', description: 'Driving sales for our SaaS products.' },
  { id: '28', title: 'Robotics Engineer', company: 'MechanoBot', location: 'Chennai, India', position: { lat: 13.0827, lng: 80.2707 }, salary: '₹15L - ₹28L', description: 'Designing and building robotic systems.' },
  { id: '29', title: 'Data Engineer', company: 'DataFlow', location: 'Chennai, India', position: { lat: 13.0827, lng: 80.2707 }, salary: '₹16L - ₹28L', description: 'Building and maintaining data pipelines.' },
  { id: '30', title: 'Cloud Support Engineer', company: 'SupportSphere', location: 'Chennai, India', position: { lat: 13.0827, lng: 80.2707 }, salary: '₹8L - ₹14L', description: 'Providing technical support for cloud services.' },
  // Kolkata
  { id: '31', title: 'SEO Specialist', company: 'RankHigh', location: 'Kolkata, India', position: { lat: 22.5726, lng: 88.3639 }, salary: '₹6L - ₹12L', description: 'Improving organic search rankings.' },
  { id: '32', title: 'Graphic Designer', company: 'Creative Canvas', location: 'Kolkata, India', position: { lat: 22.5726, lng: 88.3639 }, salary: '₹5L - ₹10L', description: 'Creating visual concepts for various media.' },
  { id: '33', title: 'IT Administrator', company: 'SysAdmin Co.', location: 'Kolkata, India', position: { lat: 22.5726, lng: 88.3639 }, salary: '₹7L - ₹13L', description: 'Managing company IT infrastructure.' },
  { id: '34', title: 'Telecommunications Engineer', company: 'ConnectFast', location: 'Kolkata, India', position: { lat: 22.5726, lng: 88.3639 }, salary: '₹9L - ₹17L', description: 'Designing and managing telecom networks.' },
  { id: '35', title: 'Accountant', company: 'Balance Sheets Inc.', location: 'Kolkata, India', position: { lat: 22.5726, lng: 88.3639 }, salary: '₹6L - ₹11L', description: 'Managing financial records and compliance.' },
  // Noida
  { id: '36', title: 'Mobile Developer (iOS)', company: 'AppCraft', location: 'Noida, India', position: { lat: 28.5355, lng: 77.3910 }, salary: '₹14L - ₹25L', description: 'Developing cutting-edge applications for iOS.' },
  { id: '37', title: 'Salesforce Developer', company: 'Cloudy CRM', location: 'Noida, India', position: { lat: 28.5355, lng: 77.3910 }, salary: '₹12L - ₹22L', description: 'Customizing and developing on the Salesforce platform.' },
  { id: '38', title: 'Video Editor', company: 'MediaMakers', location: 'Noida, India', position: { lat: 28.5355, lng: 77.3910 }, salary: '₹6L - ₹11L', description: 'Editing and producing video content.' },
  { id: '39', title: 'Network Engineer', company: 'NetSecure', location: 'Noida, India', position: { lat: 28.5355, lng: 77.3910 }, salary: '₹10L - ₹18L', description: 'Managing and securing network infrastructure.' },
  { id: '40', title: 'Operations Manager', company: 'EfficientOps', location: 'Noida, India', position: { lat: 28.5355, lng: 77.3910 }, salary: '₹18L - ₹30L', description: 'Overseeing daily business operations.' },
  // Gurugram
  { id: '41', title: 'Management Consultant', company: 'Strategy First', location: 'Gurugram, India', position: { lat: 28.4595, lng: 77.0266 }, salary: '₹25L - ₹50L', description: 'Advising clients on business strategy.' },
  { id: '42', title: 'Python Developer', company: 'PyLogic', location: 'Gurugram, India', position: { lat: 28.4595, lng: 77.0266 }, salary: '₹12L - ₹22L', description: 'Backend development using Django and Flask.' },
  { id: '43', title: 'Supply Chain Analyst', company: 'LogiChain', location: 'Gurugram, India', position: { lat: 28.4595, lng: 77.0266 }, salary: '₹10L - ₹18L', description: 'Optimizing supply chain processes.' },
  { id: '44', title: 'UI Engineer (Angular)', company: 'Interface Inc.', location: 'Gurugram, India', position: { lat: 28.4595, lng: 77.0266 }, salary: '₹13L - ₹23L', description: 'Building complex front-end applications with Angular.' },
  { id: '45', title: 'Chief Financial Officer (CFO)', company: 'Venture Capital Firm', location: 'Gurugram, India', position: { lat: 28.4595, lng: 77.0266 }, salary: '₹80L - ₹1.5Cr', description: 'Leading financial strategy for a portfolio of startups.' },
  // Mixed
  { id: '46', title: 'Biotechnologist', company: 'GeneTech', location: 'Hyderabad, India', position: { lat: 17.3850, lng: 78.4867 }, salary: '₹8L - ₹15L', description: 'Research and development in genetic engineering.' },
  { id: '47', title: 'Civil Engineer', company: 'InfraBuild', location: 'Pune, India', position: { lat: 18.5204, lng: 73.8567 }, salary: '₹9L - ₹16L', description: 'Designing and overseeing construction projects.' },
  { id: '48', title: 'Blockchain Developer', company: 'Decentral Future', location: 'Bengaluru, India', position: { lat: 12.9716, lng: 77.5946 }, salary: '₹20L - ₹40L', description: 'Building decentralized applications (dApps).' },
  { id: '49', title: 'E-commerce Manager', company: 'ShopNow', location: 'Delhi, India', position: { lat: 28.7041, lng: 77.1025 }, salary: '₹15L - ₹25L', description: 'Managing online store operations and strategy.' },
  { id: '50', title: 'Chief Technology Officer (CTO)', company: 'NextGen Startup', location: 'Mumbai, India', position: { lat: 19.0760, lng: 72.8777 }, salary: '₹70L - ₹1.2Cr', description: 'Leading the technology vision and team.' },
];

export default function JobMapPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<JobListing[]>(mockJobs);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 21.1458, lng: 79.0882 }); // Center of India
  const [zoom, setZoom] = useState(5);
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
                suppressHydrationWarning={true}
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
