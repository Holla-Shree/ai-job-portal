
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Briefcase, PlusCircle, Sparkles, Users, FileCheck2, ChevronDown, ChevronUp, Star, CalendarPlus } from "lucide-react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import withAuth from '@/components/withAuth';

// Mock Candidate Data
const MOCK_CANDIDATES = [
    { id: 'cand1', name: 'Priya Patel', profile: 'Experienced Full Stack Developer with 5 years in React and Node.js. Led a team to build a high-traffic e-commerce platform. Skilled in AWS, Docker, and PostgreSQL. B.Sc. in Computer Science from IIT Bombay.' },
    { id: 'cand2', name: 'Rohan Sharma', profile: 'Senior Backend Engineer specializing in Python, Django, and microservices architecture. 8+ years of experience building scalable financial systems. Proficient with Kubernetes and GCP. Master\'s in Software Engineering from BITS Pilani.' },
    { id: 'cand3', name: 'Anjali Menon', profile: 'Junior Frontend Developer with 1 year of experience. Strong skills in HTML, CSS, JavaScript, and React. Passionate about creating beautiful user interfaces. Completed a 6-month coding bootcamp from UpGrad.' },
    { id: 'cand4', name: 'Vikram Singh', profile: 'DevOps Engineer with 4 years of experience in CI/CD pipelines using Jenkins and GitLab. Certified Kubernetes Administrator. Expertise in Terraform and Ansible for infrastructure as code. Based in Pune.' },
    { id: 'cand5', name: 'Sneha Reddy', profile: 'Data Scientist with 3 years of experience in machine learning and predictive modeling. Proficient in Python, Scikit-learn, and TensorFlow. Experience with data visualization tools like Tableau. From Hyderabad.' },
    { id: 'cand6', name: 'Amit Kumar', profile: 'Product Manager with 6 years of experience in the SaaS industry. Proven track record of launching successful B2B products. Strong analytical skills and experience with Agile methodologies. MBA from IIM Ahmedabad.' },
    { id: 'cand7', name: 'Neha Gupta', profile: 'UX/UI Designer with a focus on mobile applications. 5 years of experience creating intuitive and user-friendly designs for iOS and Android. Proficient in Figma, Sketch, and Adobe Creative Suite. Portfolio available upon request.' },
    { id: 'cand8', name: 'Karan Malhotra', profile: 'Cybersecurity Analyst with 7 years of experience in threat detection and incident response. Certified Information Systems Security Professional (CISSP). Experience with SIEM tools like Splunk. Based in Delhi.' },
    { id: 'cand9', name: 'Isha Nair', profile: 'Digital Marketing Manager with a decade of experience in SEO, SEM, and social media marketing. Successfully managed multi-million dollar ad budgets. Google Ads certified. Currently located in Mumbai.' },
    { id: 'cand10', name: 'Rajesh Kumar', profile: 'Mobile App Developer with expertise in Flutter. 4 years of experience building cross-platform applications for startups. Published several apps on the Play Store and App Store.' },
    { id: 'cand11', name: 'Deepika Rao', profile: 'QA Automation Engineer with 5 years of experience. Expertise in building testing frameworks from scratch using Selenium and Cypress. Strong understanding of software development life cycle. From Bengaluru.' },
    { id: 'cand12', name: 'Arjun Desai', profile: 'Cloud Solutions Architect with 9 years of experience. AWS Certified Solutions Architect – Professional. Specializes in designing and implementing scalable and cost-effective cloud infrastructure for enterprises.' },
    { id: 'cand13', name: 'Sunita Joshi', profile: 'HR Business Partner with 8 years of experience in the tech industry. Expertise in talent acquisition, employee relations, and performance management. SHRM-CP certified.' },
    { id: 'cand14', name: 'Manish Verma', profile: 'Data Engineer with 4 years of experience building and maintaining ETL pipelines. Proficient in Apache Spark, Kafka, and Airflow. Experience with big data technologies on AWS.' },
    { id: 'cand15', name: 'Pooja Agarwal', profile: 'Business Analyst with a background in finance. 6 years of experience translating business requirements into technical specifications for fintech products. Based in Gurugram.' },
    { id: 'cand16', name: 'Siddharth Chatterjee', profile: 'Content Strategist and Writer with 7 years of experience creating engaging content for B2B tech companies. Expertise in long-form blog posts, white papers, and case studies. From Kolkata.' },
    { id: 'cand17', name: 'Aditi Sharma', profile: 'Salesforce Developer with 3 years of experience. Certified Salesforce Platform Developer I. Experience in Apex, Visualforce, and Lightning Web Components. Based in Noida.' },
    { id: 'cand18', name: 'Vivek Iyer', profile: 'Senior Java Developer with 10 years of experience in building enterprise-grade applications using Spring Boot and Hibernate. Strong understanding of microservices and RESTful APIs. From Chennai.' },
    { id: 'cand19', name: 'Fatima Khan', profile: 'Scrum Master with 5 years of experience facilitating agile ceremonies for multiple development teams. Certified ScrumMaster (CSM). Passionate about improving team velocity and productivity.' },
    { id: 'cand20', name: 'Nikhil Reddy', profile: 'AI/ML Engineer with 2 years of experience post-Master\'s. Researched and implemented computer vision models using PyTorch. Strong mathematical and statistical background. Graduated from IISc Bangalore.' },
];

interface ScoredCandidate extends ScreenCandidateOutput {
  candidate: { id: string; name: string; profile: string; };
}

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

function RecruiterPortalPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [screeningResults, setScreeningResults] = useState<ScoredCandidate[]>([]);
  const [screeningProgress, setScreeningProgress] = useState(0);
  const [shortlistedCandidates, setShortlistedCandidates] = useState<string[]>([]);

  const jobPostForm = useForm<JobPostingFormValues>({ resolver: zodResolver(jobPostingSchema) });
  const generatorForm = useForm<GeneratorFormValues>({ resolver: zodResolver(generatorSchema) });

  useEffect(() => {
    setIsClient(true);
  }, []);

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
  
  const handleAutoScreen: SubmitHandler<JobPostingFormValues> = async (data) => {
    setIsScreening(true);
    setScreeningResults([]);
    setShortlistedCandidates([]);
    setScreeningProgress(0);
    toast({ title: "Screening Started", description: "AI is now screening candidates against your job description." });
    
    const results: ScoredCandidate[] = [];
    try {
      for (let i = 0; i < MOCK_CANDIDATES.length; i++) {
        const candidate = MOCK_CANDIDATES[i];
        const screeningResult = await screenCandidate({
          jobDescription: data.jobDescription,
          candidateProfile: candidate.profile,
        });
        results.push({ ...screeningResult, candidate });
        setScreeningProgress(((i + 1) / MOCK_CANDIDATES.length) * 100);
      }
      results.sort((a, b) => b.score - a.score); // Sort by score descending
      setScreeningResults(results);
      toast({ title: "Screening Complete!", description: `Found and ranked ${results.length} candidates.` });
    } catch (error) {
       console.error("Error during auto-screening:", error);
       toast({ variant: "destructive", title: "Screening Failed", description: "An error occurred during the screening process." });
    } finally {
       setIsScreening(false);
       setScreeningProgress(100);
    }
  };

  const handleShortlistCandidate = (candidateId: string) => {
    setShortlistedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId); // Un-shortlist
      } else {
        toast({ title: "Candidate Shortlisted!", description: "You can find all shortlisted candidates in your dashboard." });
        return [...prev, candidateId]; // Shortlist
      }
    });
  };

  const handleScheduleInterview = (candidateName: string) => {
     toast({
        title: "Interview Scheduled",
        description: `An invitation has been sent to ${candidateName}.`,
     });
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
    if (score > 70) return "text-accent-foreground";
    if (score > 50) return "text-muted-foreground";
    return "text-destructive";
  };
  
  if (!isClient) {
    return null;
  }

  return (
      <div className="container mx-auto py-8">
        <h1 className="font-headline text-3xl font-bold mb-8 text-primary">Recruiter Tools</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="font-headline flex items-center"><PlusCircle className="mr-2" />Post a Job & Screen</CardTitle>
                <CardDescription>Fill in the details to post a job and automatically screen candidates from the talent pool.</CardDescription>
              </CardHeader>
              <form onSubmit={jobPostForm.handleSubmit(handleAutoScreen)}>
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
                  <Button type="submit" disabled={isScreening}>
                    {isScreening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Briefcase className="mr-2 h-4 w-4" />} 
                    {isScreening ? 'Screening Candidates...' : 'Post Job & Auto-Screen'}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <Card className="shadow-lg sticky top-8">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center"><Users className="mr-2" />Screening Results</CardTitle>
                  <CardDescription>Top candidates for your job will appear here, ranked by match score.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isScreening && (
                    <div className="space-y-2">
                       <Progress value={screeningProgress} className="w-full" />
                       <p className="text-sm text-muted-foreground text-center">Screening {MOCK_CANDIDATES.length} candidates... ({Math.round(screeningProgress)}%)</p>
                    </div>
                  )}
                  {!isScreening && screeningResults.length === 0 && <div className="text-center text-sm text-muted-foreground h-48 flex items-center justify-center">Post a job to see screened candidates.</div>}
                  {screeningResults.length > 0 && (
                    <ScrollArea className="h-[500px]">
                      <Accordion type="single" collapsible className="w-full">
                         {screeningResults.map((result) => (
                          <AccordionItem key={result.candidate.id} value={result.candidate.id}>
                            <AccordionTrigger>
                               <div className="flex justify-between items-center w-full pr-4">
                                 <div className="text-left flex items-center gap-2">
                                   {shortlistedCandidates.includes(result.candidate.id) && <Star className="h-4 w-4 text-amber-400 fill-amber-400" />}
                                   <div>
                                     <p className="font-semibold">{result.candidate.name}</p>
                                     <Badge variant={getBadgeVariant(result.matchStrength)} className="mt-1">{result.matchStrength}</Badge>
                                   </div>
                                 </div>
                                 <div className="text-right">
                                    <p className={`text-2xl font-bold ${getScoreColor(result.score)}`}>{result.score}</p>
                                    <p className="text-xs text-muted-foreground">Match Score</p>
                                 </div>
                               </div>
                            </AccordionTrigger>
                            <AccordionContent>
                               <div className="space-y-4 text-sm px-2">
                                 <div>
                                   <h4 className="font-semibold mb-1">Rationale</h4>
                                   <p className="text-muted-foreground whitespace-pre-wrap">{result.rationale}</p>
                                 </div>
                                 {result.missingQualifications && result.missingQualifications.length > 0 && (
                                   <div>
                                     <h4 className="font-semibold mb-1">Missing Qualifications</h4>
                                     <ul className="list-disc list-inside text-muted-foreground">
                                       {result.missingQualifications.map((q, i) => <li key={i}>{q}</li>)}
                                     </ul>
                                   </div>
                                 )}
                                 <div className="flex items-center gap-2 pt-2 border-t">
                                     <Button
                                        variant={shortlistedCandidates.includes(result.candidate.id) ? "secondary" : "outline"}
                                        size="sm"
                                        onClick={() => handleShortlistCandidate(result.candidate.id)}
                                      >
                                        <Star className={`mr-2 h-4 w-4 ${shortlistedCandidates.includes(result.candidate.id) ? 'text-amber-500 fill-amber-500' : ''}`} />
                                        {shortlistedCandidates.includes(result.candidate.id) ? 'Shortlisted' : 'Shortlist'}
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="default" size="sm">
                                            <CalendarPlus className="mr-2 h-4 w-4" />
                                            Schedule Interview
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Schedule Interview?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This will simulate sending an interview invitation to {result.candidate.name}.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleScheduleInterview(result.candidate.name)}>
                                              Confirm & Schedule
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                 </div>
                               </div>
                            </AccordionContent>
                          </AccordionItem>
                         ))}
                      </Accordion>
                    </ScrollArea>
                  )}
                </CardContent>
            </Card>
        </div>
      </div>
  );
}

export default withAuth(RecruiterPortalPage, ['recruiter', 'admin']);

    