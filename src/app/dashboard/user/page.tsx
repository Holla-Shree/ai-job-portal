
'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserCircle, Briefcase, BookOpen, FileText, Search, Sparkles } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { analyzeResume, AnalyzeResumeOutput } from '@/ai/flows/resume-analyzer';
import { recommendJobs, RecommendJobsOutput } from '@/ai/flows/job-recommendations';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import withAuth from '@/components/withAuth';

const resumeUploadSchema = z.object({
  resumeFile: z.custom<FileList>().refine(files => files && files.length > 0, "Resume file is required."),
});
type ResumeUploadFormValues = z.infer<typeof resumeUploadSchema>;

const jobRecommendationSchema = z.object({
  resumeText: z.string().min(1, "Resume text is required."),
  keywords: z.string().optional(),
});
type JobRecommendationFormValues = z.infer<typeof jobRecommendationSchema>;

function UserPortalPage() {
  const { toast } = useToast();
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<AnalyzeResumeOutput | null>(null);
  const [jobRecommendations, setJobRecommendations] = useState<RecommendJobsOutput | null>(null);

  const resumeForm = useForm<ResumeUploadFormValues>({
    resolver: zodResolver(resumeUploadSchema),
  });

  const jobForm = useForm<JobRecommendationFormValues>({
    resolver: zodResolver(jobRecommendationSchema),
  });

  const handleResumeUpload: SubmitHandler<ResumeUploadFormValues> = async (data) => {
    setIsLoadingResume(true);
    setResumeAnalysis(null);
    const file = data.resumeFile[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const resumeDataUri = e.target?.result as string;
          if (resumeDataUri) {
            const result = await analyzeResume({ resumeDataUri });
            setResumeAnalysis(result);
            // Populate resume text for job recommendations with the anonymized summary and details
            const fullText = `Summary: ${result.summary}\n\nSkills: ${result.skills.join(', ') || 'N/A'}\n\nExperience: ${result.experience.join('; ') || 'N/A'}\n\nEducation: ${result.education.join('; ') || 'N/A'}`;
            jobForm.setValue('resumeText', fullText);
            toast({ title: "Resume Analyzed", description: "Your anonymized profile has been created." });
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Resume analysis error:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to analyze resume." });
      } finally {
        setIsLoadingResume(false);
      }
    }
  };

  const handleJobRecommendation: SubmitHandler<JobRecommendationFormValues> = async (data) => {
    setIsLoadingJobs(true);
    setJobRecommendations(null);
    try {
      const result = await recommendJobs(data);
      setJobRecommendations(result);
      toast({ title: "Jobs Recommended", description: "Found potential job matches for you." });
    } catch (error) {
      console.error("Job recommendation error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to recommend jobs." });
    } finally {
      setIsLoadingJobs(false);
    }
  };

  return (
      <div className="container mx-auto py-8">
        <h1 className="font-headline text-3xl font-bold mb-8 text-primary">User Job Portal</h1>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-6">
            <TabsTrigger value="profile"><UserCircle className="mr-2" />My Profile & Resume</TabsTrigger>
            <TabsTrigger value="recommendations"><Search className="mr-2" />Job Recommendations</TabsTrigger>
            <TabsTrigger value="applications" disabled><Briefcase className="mr-2" />My Applications (Soon)</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center"><FileText className="mr-2 text-primary" />Upload & Analyze Resume</CardTitle>
                  <CardDescription>Let AI extract key information from your resume, removing personal details to ensure fair matching.</CardDescription>
                </CardHeader>
                <form onSubmit={resumeForm.handleSubmit(handleResumeUpload)}>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="resumeFile">Upload Resume (PDF, DOCX)</Label>
                        <Input id="resumeFile" type="file" accept=".pdf,.doc,.docx" {...resumeForm.register("resumeFile")} className="mt-1" />
                        {resumeForm.formState.errors.resumeFile && <p className="text-sm text-destructive mt-1">{resumeForm.formState.errors.resumeFile.message}</p>}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isLoadingResume}>
                      {isLoadingResume ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Analyze Resume
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center"><UserCircle className="mr-2 text-primary" />Anonymized Profile</CardTitle>
                  <CardDescription>Information extracted from your resume for bias-free matching.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingResume && <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                  {resumeAnalysis ? (
                    <div className="space-y-4">
                       <div>
                        <h4 className="font-semibold flex items-center"><FileText className="mr-2 h-5 w-5 text-accent" />Professional Summary</h4>
                        <p className="text-sm text-muted-foreground pl-7">{resumeAnalysis.summary || 'Not available'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold flex items-center"><Briefcase className="mr-2 h-5 w-5 text-accent" />Skills</h4>
                        <p className="text-sm text-muted-foreground pl-7">{resumeAnalysis.skills.join(', ') || 'Not available'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold flex items-center"><BookOpen className="mr-2 h-5 w-5 text-accent" />Experience</h4>
                        <ul className="list-disc list-inside pl-7 text-sm text-muted-foreground">
                          {resumeAnalysis.experience.map((exp, i) => <li key={i}>{exp}</li>).length > 0 ? resumeAnalysis.experience.map((exp, i) => <li key={i}>{exp}</li>) : <li>Not available</li>}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold flex items-center"><UserCircle className="mr-2 h-5 w-5 text-accent" />Education</h4>
                         <ul className="list-disc list-inside pl-7 text-sm text-muted-foreground">
                          {resumeAnalysis.education.map((edu, i) => <li key={i}>{edu}</li>).length > 0 ? resumeAnalysis.education.map((edu, i) => <li key={i}>{edu}</li>) : <li>Not available</li>}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    !isLoadingResume && <p className="text-sm text-muted-foreground">Upload your resume to see your anonymized profile here.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline flex items-center"><Search className="mr-2 text-primary" />AI Job Recommendations</CardTitle>
                <CardDescription>Find jobs tailored to your profile and preferences.</CardDescription>
              </CardHeader>
              <form onSubmit={jobForm.handleSubmit(handleJobRecommendation)}>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="resumeText">Your Anonymized Resume / Profile Summary</Label>
                    <Textarea id="resumeText" {...jobForm.register("resumeText")} rows={8} placeholder="Upload your resume in the 'My Profile' tab to automatically populate this." className="mt-1" />
                    {jobForm.formState.errors.resumeText && <p className="text-sm text-destructive mt-1">{jobForm.formState.errors.resumeText.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="keywords">Preferred Job Keywords (Optional)</Label>
                    <Input id="keywords" {...jobForm.register("keywords")} placeholder="e.g., Software Engineer, Remote, Marketing" className="mt-1" />
                    {jobForm.formState.errors.keywords && <p className="text-sm text-destructive mt-1">{jobForm.formState.errors.keywords.message}</p>}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoadingJobs}>
                    {isLoadingJobs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Get Job Recommendations
                  </Button>
                </CardFooter>
              </form>
              {isLoadingJobs && <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              {jobRecommendations && (
                <CardContent className="mt-6">
                  <h3 className="font-headline text-xl font-semibold mb-4">Recommended Jobs:</h3>
                  {jobRecommendations.jobRecommendations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {jobRecommendations.jobRecommendations.map((job, index) => (
                        <Card key={index} className="flex flex-col">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Briefcase className="h-5 w-5 text-primary" />
                              {job.title}
                            </CardTitle>
                            <CardDescription className="text-xs pt-1">
                              Typically at: {job.company}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">{job.reasoning}</p>
                          </CardContent>
                           <CardFooter>
                              <Button variant="secondary" size="sm" className="w-full">
                                  Find Similar
                              </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No specific job titles recommended based on the input. Try refining your resume text or keywords.</p>
                  )}
                </CardContent>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center"><Briefcase className="mr-2 text-primary" />Application Tracker</CardTitle>
                    <CardDescription>Keep track of all your job applications in one place.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">This feature is coming soon!</p>
                        <p className="text-sm text-muted-foreground mt-2">You'll be able to see the status of your applications here.</p>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}

export default withAuth(UserPortalPage, ['user', 'admin']);
