'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Briefcase, PlusCircle, Sparkles, Users, FileCheck2 } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { generateJobDescription } from '@/ai/flows/job-description-generator';
import { screenCandidate, ScreenCandidateOutput } from '@/ai/flows/candidate-screener';

// Job Posting form schema
const jobPostingSchema = z.object({
  jobTitle: z.string().min(3, "Job title must be at least 3 characters."),
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  location: z.string().min(2, "Location is required."),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters."),
});
type JobPostingFormValues = z.infer<typeof jobPostingSchema>;

// AI Generator form schema
const generatorSchema = z.object({
  jobTitle: z.string().min(3, "Job title is required to generate a description."),
  notes: z.string().optional(),
});
type GeneratorFormValues = z.infer<typeof generatorSchema>;

// Candidate Screener form schema
const screenerSchema = z.object({
  jobDescription: z.string().min(50, "A full job description is required."),
  candidateProfile: z.string().min(50, "A candidate profile/resume text is required."),
});
type ScreenerFormValues = z.infer<typeof screenerSchema>;


export default function RecruiterPortalPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [screeningResult, setScreeningResult] = useState<ScreenCandidateOutput | null>(null);

  const jobPostForm = useForm<JobPostingFormValues>({ resolver: zodResolver(jobPostingSchema) });
  const generatorForm = useForm<GeneratorFormValues>({ resolver: zodResolver(generatorSchema) });
  const screenerForm = useForm<ScreenerFormValues>({ resolver: zodResolver(screenerSchema) });

  // Sync job title from main form to generator form when dialog opens
  React.useEffect(() => {
    if (isGeneratorOpen) {
      const currentJobTitle = jobPostForm.getValues("jobTitle");
      if (currentJobTitle) {
        generatorForm.setValue("jobTitle", currentJobTitle);
      }
    }
  }, [isGeneratorOpen, jobPostForm, generatorForm]);

  const handleJobPost: SubmitHandler<JobPostingFormValues> = async (data) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Job Posting Data:", data);
    toast({ title: "Job Posted!", description: `The job "${data.jobTitle}" has been successfully posted.` });
    jobPostForm.reset();
    setIsSubmitting(false);
  };
  
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
  
  const handleScreenCandidate: SubmitHandler<ScreenerFormValues> = async (data) => {
    setIsScreening(true);
    setScreeningResult(null);
    try {
      const result = await screenCandidate(data);
      setScreeningResult(result);
      toast({ title: "Screening Complete", description: "Candidate has been evaluated." });
    } catch (error) {
      console.error("Error screening candidate:", error);
      toast({ variant: "destructive", title: "Screening Failed", description: "Could not evaluate the candidate." });
    } finally {
      setIsScreening(false);
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

  return (
    <ScrollArea className="h-[calc(100vh-theme(spacing.32))]">
      <div className="container mx-auto py-8">
        <h1 className="font-headline text-3xl font-bold mb-8 text-primary">Recruiter Tools</h1>

        <Tabs defaultValue="post-job" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 mb-6 max-w-2xl mx-auto">
            <TabsTrigger value="post-job"><PlusCircle className="mr-2" />Post a Job</TabsTrigger>
            <TabsTrigger value="screen-candidate"><Users className="mr-2" />Candidate Screener</TabsTrigger>
          </TabsList>

          <TabsContent value="post-job">
            <Card className="max-w-2xl mx-auto shadow-xl">
              <CardHeader>
                <CardTitle className="font-headline flex items-center">Post a New Job</CardTitle>
                <CardDescription>Fill in the details below to publish a job listing.</CardDescription>
              </CardHeader>
              <form onSubmit={jobPostForm.handleSubmit(handleJobPost)}>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" {...jobPostForm.register("jobTitle")} placeholder="e.g., Senior Software Engineer" />
                    {jobPostForm.formState.errors.jobTitle && <p className="text-sm text-destructive mt-1">{jobPostForm.formState.errors.jobTitle.message}</p>}
                  </div>
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
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Briefcase className="mr-2 h-4 w-4" />} Post Job
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="screen-candidate">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="font-headline">AI Candidate Screener</CardTitle>
                  <CardDescription>Evaluate a candidate against a job description.</CardDescription>
                </CardHeader>
                <form onSubmit={screenerForm.handleSubmit(handleScreenCandidate)}>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="jdScreener">Job Description</Label>
                      <Textarea id="jdScreener" {...screenerForm.register("jobDescription")} rows={8} placeholder="Paste the full job description here." />
                      {screenerForm.formState.errors.jobDescription && <p className="text-sm text-destructive mt-1">{screenerForm.formState.errors.jobDescription.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="candidateProfile">Candidate Profile / Resume Text</Label>
                      <Textarea id="candidateProfile" {...screenerForm.register("candidateProfile")} rows={8} placeholder="Paste the candidate's resume text or anonymized profile here." />
                      {screenerForm.formState.errors.candidateProfile && <p className="text-sm text-destructive mt-1">{screenerForm.formState.errors.candidateProfile.message}</p>}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isScreening}>
                      {isScreening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2 h-4 w-4" />}
                      Screen Candidate
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card className="shadow-lg sticky top-24">
                <CardHeader>
                  <CardTitle className="font-headline">Screening Result</CardTitle>
                  <CardDescription>The AI's evaluation will appear here.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isScreening && <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                  {!isScreening && !screeningResult && <div className="text-center text-sm text-muted-foreground h-48 flex items-center justify-center">Submit a job and candidate to see results.</div>}
                  {screeningResult && (
                    <div className="space-y-4 text-sm">
                       <div>
                         <h4 className="font-semibold mb-2">Match Strength</h4>
                         <Badge variant={getBadgeVariant(screeningResult.matchStrength)}>{screeningResult.matchStrength}</Badge>
                       </div>
                       <div>
                         <h4 className="font-semibold mb-1">Rationale</h4>
                         <p className="text-muted-foreground whitespace-pre-wrap">{screeningResult.rationale}</p>
                       </div>
                       {screeningResult.missingQualifications && screeningResult.missingQualifications.length > 0 && (
                         <div>
                           <h4 className="font-semibold mb-1">Missing Qualifications</h4>
                           <ul className="list-disc list-inside text-muted-foreground">
                             {screeningResult.missingQualifications.map((q, i) => <li key={i}>{q}</li>)}
                           </ul>
                         </div>
                       )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
