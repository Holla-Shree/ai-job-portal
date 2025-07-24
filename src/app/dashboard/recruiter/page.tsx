

'use client';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Briefcase, PlusCircle, Sparkles, Users, FileCheck2, ChevronDown, ChevronUp, Star, CalendarPlus, Search, MessageSquare, Trash2, UserSearch } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { generateJobDescription } from '@/ai/flows/job-description-generator';
import { screenCandidate, ScreenCandidateOutput } from '@/ai/flows/candidate-screener';
import { Progress } from '@/components/ui/progress';
import withAuth from '@/components/withAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications, Job } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


interface ScoredCandidate extends ScreenCandidateOutput {
  candidate: { id: string; name: string; profile: string; };
}

// Job Posting form schema
const jobPostingSchema = z.object({
  jobTitle: z.string().min(3, "Job title must be at least 3 characters."),
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  location: z.string().min(2, "Location is required."),
  type: z.string().min(1, "Job type is required"),
  domain: z.string().min(1, "Job domain is required"),
  salary: z.string().min(1, "Salary is required"),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters."),
});
type JobPostingFormValues = z.infer<typeof jobPostingSchema>;

// AI Generator form schema
const generatorSchema = z.object({
  jobTitle: z.string().min(3, "Job title is required to generate a description."),
  notes: z.string().optional(),
});
type GeneratorFormValues = z.infer<typeof generatorSchema>;


function RecruiterPortalContent() {
  const { toast } = useToast();
  const { updateApplicationStatus, candidates, addJob, jobs, deleteJob } = useNotifications();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [showScreeningStartToast, setShowScreeningStartToast] = useState(false);
  const [showScreeningCompleteToast, setShowScreeningCompleteToast] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [screeningResults, setScreeningResults] = useState<ScoredCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<ScoredCandidate | null>(null);
  const [screeningProgress, setScreeningProgress] = useState(0);
  const [shortlistedCandidates, setShortlistedCandidates] = useState<string[]>([]);
  const [talentSearchTerm, setTalentSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("postJob");
  const [activeScreeningJobTitle, setActiveScreeningJobTitle] = useState<string | null>(null);
  
  const jobPostForm = useForm<JobPostingFormValues>({ resolver: zodResolver(jobPostingSchema) });
  const generatorForm = useForm<GeneratorFormValues>({ resolver: zodResolver(generatorSchema) });

  useEffect(() => {
    setIsClient(true);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
    const storedShortlisted = localStorage.getItem('shortlistedCandidates');
    if (storedShortlisted) {
      setShortlistedCandidates(JSON.parse(storedShortlisted));
    }
  }, [searchParams]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('shortlistedCandidates', JSON.stringify(shortlistedCandidates));
    }
  }, [shortlistedCandidates, isClient]);

  useEffect(() => {
    if (showScreeningStartToast) {
        toast({ title: `Screening for "${activeScreeningJobTitle}"`, description: "AI is now screening candidates..." });
        setShowScreeningStartToast(false);
    }
  }, [showScreeningStartToast, activeScreeningJobTitle, toast]);

  useEffect(() => {
      if (showScreeningCompleteToast) {
          toast({ title: "Screening Complete!", description: `Found and ranked ${screeningResults.length} candidates for "${activeScreeningJobTitle}".` });
          setShowScreeningCompleteToast(false);
      }
  }, [showScreeningCompleteToast, screeningResults.length, activeScreeningJobTitle, toast]);
  

  const filteredTalentPool = useMemo(() => {
    if (!talentSearchTerm) return candidates;
    const lowercasedTerm = talentSearchTerm.toLowerCase();
    return candidates.filter(
      (candidate) =>
        (candidate.name && candidate.name.toLowerCase().includes(lowercasedTerm)) ||
        candidate.profile.toLowerCase().includes(lowercasedTerm)
    );
  }, [talentSearchTerm, candidates]);

  const getShortlistedCandidatesDetails = useMemo(() => {
    return candidates.filter(candidate => shortlistedCandidates.includes(candidate.id));
  }, [shortlistedCandidates, candidates]);


  React.useEffect(() => {
    if (isGeneratorOpen) {
      const currentJobTitle = jobPostForm.getValues("jobTitle");
      if (currentJobTitle) {
        generatorForm.setValue("jobTitle", currentJobTitle);
      }
    }
  }, [isGeneratorOpen, jobPostForm, generatorForm]);
  
  const handleGenerateDescription: SubmitHandler<GeneratorFormValues> = async (data) => {
    setIsGenerating(true);
    try {
      const result = await generateJobDescription({ jobTitle: data.jobTitle, notes: data.notes });
      if (result.jobDescription) {
        jobPostForm.setValue("jobDescription", result.jobDescription, { shouldValidate: true });
        toast({ title: "Description Generated!", description: "The job description has been populated." });
        setIsGeneratorOpen(false);
        generatorForm.reset();
      } else {
        throw new Error("AI did not return a description.");
      }
    } catch (error) {
      console.error("Error generating job description:", error);
      toast({ variant: "destructive", title: "Generation Failed", description: "Could not generate job description." });
    } finally {
      setIsGenerating(false);
    }
  };
  
 const handlePostJob: SubmitHandler<JobPostingFormValues> = (data) => {
    const newJob: Job = {
        id: `temp-${Date.now()}`,
        title: data.jobTitle,
        company: data.companyName,
        city: data.location,
        type: data.type,
        domain: data.domain,
        salary: data.salary,
        description: data.jobDescription,
        position: { lat: 20.5937, lng: 78.9629 }, // Default position
    };
    
    addJob(newJob);
    
    toast({ title: "Job Posted Successfully", description: "You can now view and manage it in 'My Postings'." });
    jobPostForm.reset();
    setActiveTab("postings");
  };

  const handleScreeningForJob = async (job: Job) => {
      setActiveTab('screeningResults');
      setIsScreening(true);
      setScreeningResults([]);
      setSelectedCandidate(null);
      setScreeningProgress(0);
      setActiveScreeningJobTitle(job.title);
      setShowScreeningStartToast(true);
      
      const results: ScoredCandidate[] = [];
      try {
        for (let i = 0; i < candidates.length; i++) {
          const candidate = candidates[i];
          const screeningResult = await screenCandidate({
            jobDescription: job.description,
            candidateProfile: candidate.profile,
          });
          results.push({ ...screeningResult, candidate });
          setScreeningProgress(((i + 1) / candidates.length) * 100);
        }
        results.sort((a, b) => b.score - a.score); // Sort by score descending
        setScreeningResults(results);
        setSelectedCandidate(results[0] || null);
        setShowScreeningCompleteToast(true);
      } catch (error) {
         console.error("Error during auto-screening:", error);
         toast({ variant: "destructive", title: "Screening Failed", description: "An error occurred during the screening process." });
      } finally {
         setIsScreening(false);
         setScreeningProgress(100);
      }
  }


  const handleShortlistCandidate = (candidateId: string) => {
    setShortlistedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId); // Un-shortlist
      } else {
        toast({ title: "Candidate Shortlisted!", description: "You can find all shortlisted candidates in the 'Shortlisted' tab." });
        return [...prev, candidateId]; // Shortlist
      }
    });
  };

  const handleScheduleInterview = (candidateId: string, candidateName: string) => {
     updateApplicationStatus(candidateId, 'Interview');
     toast({
        title: "Interview Scheduled",
        description: `An invitation has been sent to ${candidateName} and their application status has been updated.`,
     });
  };
  
  const handleMessageCandidate = (candidateName: string, jobTitle: string) => {
    const partnerName = candidateName || "a candidate";
    const company = jobPostForm.getValues("companyName") || "your company";
    const suggestedMessage = `Hi ${partnerName}, I'm reaching out regarding the ${jobTitle} position at ${company}. I was impressed by your profile and would like to discuss this opportunity further.`;

    router.push(`/dashboard/messaging?jobTitle=${encodeURIComponent(jobTitle)}&company=${encodeURIComponent(company)}&partnerName=${encodeURIComponent(partnerName)}&message=${encodeURIComponent(suggestedMessage)}`);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      toast({ title: "Job Deleted", description: "The job posting has been successfully removed." });
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the job posting." });
    }
  };

  const getBadgeVariant = (strength: ScreenCandidateOutput['matchStrength']) => {
    switch (strength) {
      case 'Strong Match': return 'default';
      case 'Good Match': return 'secondary';
      case 'Weak Match': return 'outline';
      case 'Not a Fit': return 'destructive';
      default: return 'outline';
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 85) return "text-primary";
    if (score > 70) return "text-amber-600";
    if (score > 50) return "text-muted-foreground";
    return "text-destructive";
  };
  
  if (!isClient) {
    return null;
  }

  return (
      <div className="container mx-auto py-8">
        <h1 className="font-headline text-3xl font-bold mb-8 text-primary">Recruiter Portal</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="postJob"><PlusCircle className="mr-2" />Post a Job</TabsTrigger>
            <TabsTrigger value="postings"><Briefcase className="mr-2" />My Postings</TabsTrigger>
            <TabsTrigger value="screeningResults"><Sparkles className="mr-2" />Screening Results</TabsTrigger>
            <TabsTrigger value="shortlisted"><Star className="mr-2" />Shortlisted</TabsTrigger>
            <TabsTrigger value="talent"><Users className="mr-2" />Talent Pool</TabsTrigger>
          </TabsList>
          
          <TabsContent value="postJob">
              <Card className="shadow-xl max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center"><PlusCircle className="mr-2" />Post a New Job</CardTitle>
                  <CardDescription>Fill in the details to post a job. You can screen candidates from the "My Postings" tab.</CardDescription>
                </CardHeader>
                <form onSubmit={jobPostForm.handleSubmit(handlePostJob)}>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input id="jobTitle" {...jobPostForm.register("jobTitle")} placeholder="e.g., Senior Software Engineer" />
                      {jobPostForm.formState.errors.jobTitle && <p className="text-sm text-destructive mt-1">{jobPostForm.formState.errors.jobTitle.message}</p>}
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input id="companyName" {...jobPostForm.register("companyName")} placeholder="e.g., Tech Solutions Inc." />
                            {jobPostForm.formState.errors.companyName && <p className="text-sm text-destructive mt-1">{jobPostForm.formState.errors.companyName.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" {...jobPostForm.register("location")} placeholder="e.g., San Francisco, CA or Remote" />
                            {jobPostForm.formState.errors.location && <p className="text-sm text-destructive mt-1">{jobPostForm.formState.errors.location.message}</p>}
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="type">Job Type</Label>
                            <Input id="type" {...jobPostForm.register("type")} placeholder="e.g., Full-time" />
                            {jobPostForm.formState.errors.type && <p className="text-sm text-destructive mt-1">{jobPostForm.formState.errors.type.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="domain">Domain</Label>
                            <Input id="domain" {...jobPostForm.register("domain")} placeholder="e.g., Tech" />
                            {jobPostForm.formState.errors.domain && <p className="text-sm text-destructive mt-1">{jobPostForm.formState.errors.domain.message}</p>}
                        </div>
                     </div>
                      <div>
                            <Label htmlFor="salary">Salary / Compensation</Label>
                            <Input id="salary" {...jobPostForm.register("salary")} placeholder="e.g., ₹20-25 LPA" />
                            {jobPostForm.formState.errors.salary && <p className="text-sm text-destructive mt-1">{jobPostForm.formState.errors.salary.message}</p>}
                        </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="jobDescription">Job Description</Label>
                        <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="link" size="sm" className="text-primary p-0 h-auto">
                              <Sparkles className="mr-1.5 h-4 w-4" /> Generate with AI
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <form onSubmit={generatorForm.handleSubmit(handleGenerateDescription)}>
                              <DialogHeader>
                                <DialogTitle>Generate Job Description</DialogTitle>
                                <DialogDescription>Provide a job title and notes, and the AI will draft a description.</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <Input {...generatorForm.register("jobTitle")} placeholder="Job Title" />
                                {generatorForm.formState.errors.jobTitle && <p className="text-sm text-destructive mt-1">{generatorForm.formState.errors.jobTitle.message}</p>}
                                <Textarea {...generatorForm.register("notes")} placeholder="Keywords / Notes (Optional)..." />
                              </div>
                              <DialogFooter>
                                <Button type="submit" disabled={isGenerating}>
                                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Textarea id="jobDescription" {...jobPostForm.register("jobDescription")} rows={8} placeholder="Provide a detailed description or generate one." />
                      {jobPostForm.formState.errors.jobDescription && <p className="text-sm text-destructive mt-1">{jobPostForm.formState.errors.jobDescription.message}</p>}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isPosting}>
                      {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Briefcase className="mr-2 h-4 w-4" />} 
                      {isPosting ? 'Posting Job...' : 'Post Job'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
          </TabsContent>

          <TabsContent value="postings">
             <Card className="shadow-xl">
              <CardHeader>
                  <CardTitle className="font-headline flex items-center"><Briefcase className="mr-2" />My Job Postings</CardTitle>
                  <CardDescription>Manage your active job listings and screen candidates.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.length > 0 ? (
                        jobs.map((job) => (
                            <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.title}</TableCell>
                            <TableCell>{job.company}</TableCell>
                            <TableCell>{job.city}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleScreeningForJob(job)} disabled={isScreening}>
                                    <Sparkles className="mr-2 h-3 w-3" />
                                    Screen
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="mr-2 h-3 w-3" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the job posting for "{job.title}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteJob(job.id)} className="bg-destructive hover:bg-destructive/90">
                                            Confirm Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                            </TableRow>
                        ))
                      ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                You haven't posted any jobs yet.
                            </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
           <TabsContent value="screeningResults">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center"><Users className="mr-2" />Screening Results</CardTitle>
                        <CardDescription>
                            {activeScreeningJobTitle 
                                ? `Top candidates for "${activeScreeningJobTitle}", ranked by match score.`
                                : "Select a job to screen from the 'My Postings' tab to see results here."
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isScreening && (
                        <div className="space-y-2">
                            <Progress value={screeningProgress} className="w-full" />
                            <p className="text-sm text-muted-foreground text-center">Screening {candidates.length} candidates... ({Math.round(screeningProgress)}%)</p>
                        </div>
                      )}
                      {!isScreening && screeningResults.length === 0 && (
                          <div className="text-center text-sm text-muted-foreground h-48 flex flex-col items-center justify-center">
                              <p>No screening results to display.</p>
                              <Button variant="link" onClick={() => setActiveTab('postings')}>Go to My Postings to start screening</Button>
                          </div>
                      )}
                      {screeningResults.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                            {/* Candidate List Panel */}
                            <div className="md:col-span-1 border-r pr-2">
                                <ScrollArea className="h-full">
                                    <div className="space-y-2">
                                        {screeningResults.map((result) => (
                                            <Card 
                                                key={result.candidate.id}
                                                className={cn(
                                                    "cursor-pointer hover:bg-muted/50 transition-colors",
                                                    selectedCandidate?.candidate.id === result.candidate.id && "bg-muted border-primary"
                                                )}
                                                onClick={() => setSelectedCandidate(result)}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-semibold text-sm">{result.candidate.name || "Unnamed Candidate"}</p>
                                                            <Badge variant={getBadgeVariant(result.matchStrength)} className="mt-1">{result.matchStrength}</Badge>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-xl font-bold ${getScoreColor(result.score)}`}>{result.score}</p>
                                                            <p className="text-xs text-muted-foreground">Score</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                            {/* Details Panel */}
                            <div className="md:col-span-2">
                                <ScrollArea className="h-full">
                                    {selectedCandidate ? (
                                        <div className="space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-xl font-bold">{selectedCandidate.candidate.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant={getBadgeVariant(selectedCandidate.matchStrength)}>{selectedCandidate.matchStrength}</Badge>
                                                        <span className={`font-semibold ${getScoreColor(selectedCandidate.score)}`}>Score: {selectedCandidate.score}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleShortlistCandidate(selectedCandidate.candidate.id)}
                                                    title={shortlistedCandidates.includes(selectedCandidate.candidate.id) ? 'Remove from shortlist' : 'Add to shortlist'}
                                                >
                                                    <Star className={`h-5 w-5 transition-colors ${shortlistedCandidates.includes(selectedCandidate.candidate.id) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
                                                </Button>
                                            </div>
                                            <Separator />
                                            <div>
                                                <h4 className="font-semibold mb-2">AI Rationale</h4>
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedCandidate.rationale}</p>
                                            </div>
                                            {selectedCandidate.missingQualifications && selectedCandidate.missingQualifications.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold mb-2">Missing Qualifications</h4>
                                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                                    {selectedCandidate.missingQualifications.map((q, i) => <li key={i}>{q}</li>)}
                                                </ul>
                                            </div>
                                            )}
                                            <Separator />
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleMessageCandidate(selectedCandidate.candidate.name, activeScreeningJobTitle || 'this opportunity')}>
                                                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="default" size="sm">
                                                            <CalendarPlus className="mr-2 h-4 w-4" /> Schedule Interview
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Schedule Interview?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will simulate sending an interview invitation to {selectedCandidate.candidate.name}.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleScheduleInterview(selectedCandidate.candidate.id, selectedCandidate.candidate.name)}>
                                                                Confirm & Schedule
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full">
                                            <UserSearch className="w-12 h-12 mb-4" />
                                            <p className="font-semibold">Select a candidate</p>
                                            <p className="text-sm">Click on a candidate from the list to see their detailed screening report.</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                      )}
                    </CardContent>
                </Card>
           </TabsContent>

          <TabsContent value="shortlisted">
             <Card className="shadow-xl">
              <CardHeader>
                  <CardTitle className="font-headline flex items-center"><Star className="mr-2" />Shortlisted Candidates</CardTitle>
                  <CardDescription>Your top candidates across all job postings.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                    {getShortlistedCandidatesDetails.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {getShortlistedCandidatesDetails.map((candidate) => (
                                <AccordionItem value={candidate.id} key={candidate.id}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={`https://placehold.co/40x40.png?text=${candidate.name ? candidate.name.charAt(0) : 'C'}`} alt={candidate.name || 'Candidate'} data-ai-hint="person avatar"/>
                                                <AvatarFallback>{candidate.name ? candidate.name.charAt(0) : 'C'}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-semibold">{candidate.name || 'Unnamed Candidate'}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="pl-4 space-y-4">
                                            <div>
                                                <h4 className="font-semibold mb-1 text-sm">Profile Summary</h4>
                                                <p className="text-muted-foreground text-xs whitespace-pre-wrap">{candidate.profile}</p>
                                            </div>
                                            <Separator />
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleMessageCandidate(candidate.name || 'this candidate', "this opportunity")}>
                                                    <MessageSquare className="mr-2 h-3 w-3" />
                                                    Message
                                                </Button>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button size="sm">
                                                      <CalendarPlus className="mr-2 h-3 w-3" />
                                                      Schedule
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Schedule Interview?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                        This will send an invitation to {candidate.name} and update their application status.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleScheduleInterview(candidate.id, candidate.name || 'this candidate')}>
                                                            Confirm
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                                <Button variant="ghost" size="icon" onClick={() => handleShortlistCandidate(candidate.id)}>
                                                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                                    <span className="sr-only">Remove from shortlist</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
                            No candidates have been shortlisted yet.
                        </div>
                    )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="talent">
            <Card className="shadow-xl">
              <CardHeader>
                  <CardTitle className="font-headline flex items-center"><Users className="mr-2" />Talent Pool</CardTitle>
                  <CardDescription>Browse and search all candidates in the system.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name or keywords..."
                      className="pl-10"
                      value={talentSearchTerm}
                      onChange={(e) => setTalentSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Profile Summary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTalentPool.map((candidate) => (
                        <TableRow key={candidate.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={`https://placehold.co/40x40.png?text=${candidate.name ? candidate.name.charAt(0) : 'C'}`} alt={candidate.name || 'Candidate'} data-ai-hint="person avatar"/>
                                <AvatarFallback>{candidate.name ? candidate.name.charAt(0) : 'C'}</AvatarFallback>
                              </Avatar>
                              <span>{candidate.name || 'Unnamed Candidate'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{candidate.profile}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}


function RecruiterPortalPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RecruiterPortalContent />
        </Suspense>
    )
}

export default withAuth(RecruiterPortalPage, ['recruiter', 'admin']);
