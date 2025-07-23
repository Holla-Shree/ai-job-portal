

'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserCircle, Briefcase, BookOpen, FileText, Search, Sparkles, Award, ArrowLeft, MessageSquare, Camera, Bookmark } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { analyzeResume, AnalyzeResumeOutput } from '@/ai/flows/resume-analyzer';
import { recommendJobs, RecommendJobsOutput } from '@/ai/flows/job-recommendations';
import { useToast } from '@/hooks/use-toast';
import withAuth from '@/components/withAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


const resumeUploadSchema = z.object({
  resumeFile: z.custom<FileList>().refine(files => files && files.length > 0, "Resume file is required."),
});
type ResumeUploadFormValues = z.infer<typeof resumeUploadSchema>;

const jobRecommendationSchema = z.object({
  resumeText: z.string().min(1, "Resume text is required."),
  keywords: z.string().optional(),
});
type JobRecommendationFormValues = z.infer<typeof jobRecommendationSchema>;

type RecommendedJob = RecommendJobsOutput['jobRecommendations'][0] & { id: string };

function JobDetails({ job, onBack }: { job: RecommendedJob; onBack: () => void; }) {
    const { toast } = useToast();
    const { addNotification, initiateConversation, saveJob, unsaveJob } = useNotifications();
    const { user } = useAuth();
    const router = useRouter();
    
    const isSaved = user?.savedJobs.includes(job.id);

    const handleApply = () => {
        addNotification(job.title, job.company);
        toast({
            title: "Application Submitted!",
            description: `Your application for the ${job.title} role at ${job.company} has been sent. The recruiter will be notified.`,
        });
    };

    const handleMessageRecruiter = () => {
        const conversationId = initiateConversation({
            jobTitle: job.title,
            company: job.company,
            partnerName: `Recruiter @ ${job.company}`
        });
        const message = `Hi, I'm interested in the ${job.title} position and had a few questions.`;
        router.push(`/dashboard/messaging?open=${conversationId}&message=${encodeURIComponent(message)}`);
    }

    const handleToggleSave = () => {
        if (isSaved) {
            unsaveJob(job.id);
            toast({ title: 'Job Unsaved' });
        } else {
            saveJob(job.id);
            toast({ title: 'Job Saved!' });
        }
    };
    
    return (
        <Card className="shadow-lg">
            <CardHeader>
                 <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 justify-start p-0 h-auto w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to recommendations
                </Button>
                <CardTitle className="font-headline text-2xl">{job.title}</CardTitle>
                <CardDescription>{job.company}</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    <div className="space-y-4 text-sm pr-4">
                        <h3 className="font-semibold">Job Description</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="flex items-center gap-2">
                 <Button className="w-full" onClick={handleApply}>Apply Now</Button>
                 <Button variant="outline" className="w-full" onClick={handleMessageRecruiter}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Message Recruiter
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleToggleSave()} title={isSaved ? "Unsave Job" : "Save Job"}>
                    <Bookmark className={cn("h-5 w-5", isSaved && "fill-primary text-primary")} />
                </Button>
            </CardFooter>
        </Card>
    )
}

function UserProfileCard() {
    const { user, updateAvatar } = useAuth();
    const { candidates, updateCandidateProfile } = useNotifications();
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const currentUserProfile = React.useMemo(() => {
        return candidates.find(c => c.id === user?.id);
    }, [candidates, user]);

    useEffect(() => {
        if (currentUserProfile) {
            setName(currentUserProfile.name || user?.email?.split('@')[0] || '');
            const profileParts = currentUserProfile.profile.split('Summary:');
            const bioText = profileParts.length > 1 ? profileParts[0].trim() : (currentUserProfile.profile.startsWith('Newly registered') ? '' : currentUserProfile.profile);
            setBio(bioText);
        } else if (user) {
            setName(user.email?.split('@')[0] || '');
            setBio('');
        }
    }, [currentUserProfile, user]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                updateAvatar(dataUrl);
                toast({
                    title: 'Profile Picture Updated',
                    description: 'Your new profile picture has been saved.',
                });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSaveChanges = async () => {
        if (!user?.id) return;
        
        let existingProfile = currentUserProfile?.profile || '';
        const bioExists = existingProfile.includes("Summary:");
        if (bioExists) {
            existingProfile = existingProfile.substring(existingProfile.indexOf("Summary:"));
        }
        
        const updatedProfile = `${bio}\n\n${existingProfile}`;

        await updateCandidateProfile(user.id, {
            name: name,
            profile: updatedProfile,
        });

        toast({
            title: 'Profile Saved',
            description: 'Your changes have been saved to your profile.',
        });
    }

    return (
        <Card>
            <CardHeader className="items-center text-center">
                 <div className="relative">
                    <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                        <AvatarImage src={user?.avatar} alt="User Avatar" data-ai-hint="person avatar" />
                        <AvatarFallback>{name ? name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                    <div 
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90"
                        onClick={handleAvatarClick}
                    >
                        <Camera className="h-4 w-4" />
                    </div>
                    <Input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg"
                    />
                </div>
                 <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xl font-bold text-center border-0 focus:ring-0 shadow-none"
                 />
                <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea 
                    placeholder="Add a short bio about yourself..." 
                    rows={3} 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                />
            </CardContent>
             <CardFooter>
                <Button className="w-full" onClick={handleSaveChanges}>Save Changes</Button>
            </CardFooter>
        </Card>
    )
}


function UserProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateCandidateProfile, candidates } = useNotifications();
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<AnalyzeResumeOutput | null>(null);
  const [jobRecommendations, setJobRecommendations] = useState<RecommendJobsOutput | null>(null);
  const [selectedJob, setSelectedJob] = useState<RecommendedJob | null>(null);

  const resumeForm = useForm<ResumeUploadFormValues>({
    resolver: zodResolver(resumeUploadSchema),
  });

  const jobForm = useForm<JobRecommendationFormValues>({
    resolver: zodResolver(jobRecommendationSchema),
  });

  const currentUserProfile = React.useMemo(() => {
    return candidates.find(c => c.id === user?.id);
  }, [candidates, user]);

  useEffect(() => {
    if (currentUserProfile?.profile) {
      jobForm.setValue('resumeText', currentUserProfile.profile);
    }
  }, [currentUserProfile, jobForm]);


  const handleResumeUpload: SubmitHandler<ResumeUploadFormValues> = async (data) => {
    if (!user?.id) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to upload a resume." });
        return;
    }
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
            
            // Construct the full text profile
            const experienceText = result.experience.map(exp => `${exp.jobTitle} at ${exp.company} (${exp.duration}): ${exp.responsibilities.join('. ')}`).join('\\n\\n');
            const educationText = result.education.map(edu => `${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`).join('\\n');
            const projectsText = result.projects.map(p => `${p.title}: ${p.description} (Tech: ${p.technologies.join(', ')})`).join('\\n\\n');
            const fullText = `Summary: ${result.anonymizedSummary}\\n\\nSkills: ${result.skills.join(', ') || 'N/A'}\\n\\nExperience:\\n${experienceText || 'N/A'}\\n\\nEducation:\\n${educationText || 'N/A'}\\n\\nProjects:\\n${projectsText || 'N/A'}\\n\\nCertifications: ${result.certifications.join(', ') || 'N/A'}`;
            
            // Update Firestore
            await updateCandidateProfile(user.id, {
                profile: fullText,
            });
            jobForm.setValue('resumeText', fullText);
            
            toast({ title: "Resume Analyzed & Saved", description: "Your anonymized profile has been created and saved." });
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
    setSelectedJob(null);
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
  
  const handleFindSimilar = (jobTitle: string) => {
    jobForm.setValue('keywords', jobTitle);
    jobForm.handleSubmit(handleJobRecommendation)();
  };


  return (
      <div className="w-full">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 mb-6">
            <TabsTrigger value="profile"><UserCircle className="mr-2" />My Profile & Resume</TabsTrigger>
            <TabsTrigger value="recommendations"><Search className="mr-2" />Job Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                   <UserProfileCard />
                </div>
                <div className="md:col-span-2">
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
                              Analyze & Save Profile
                            </Button>
                          </CardFooter>
                        </form>
                    </Card>
                    <Card className="shadow-lg mt-6">
                        <CardHeader>
                          <CardTitle className="font-headline flex items-center"><UserCircle className="mr-2 text-primary" />Anonymized Profile</CardTitle>
                          <CardDescription>This is the information recruiters see. It is updated when you analyze a new resume.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[400px]">
                          {isLoadingResume && <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                          {resumeAnalysis ? (
                            <div className="space-y-4 pr-4">
                               <div>
                                <h4 className="font-semibold flex items-center"><FileText className="mr-2 h-5 w-5 text-accent" />Professional Summary</h4>
                                <p className="text-sm text-muted-foreground pl-7">{resumeAnalysis.anonymizedSummary || 'Not available'}</p>
                              </div>
                              <Separator />
                              <div>
                                <h4 className="font-semibold flex items-center"><Sparkles className="mr-2 h-5 w-5 text-accent" />Skills</h4>
                                <p className="text-sm text-muted-foreground pl-7">{resumeAnalysis.skills.join(', ') || 'Not available'}</p>
                              </div>
                              <Separator />
                              <div>
                                <h4 className="font-semibold flex items-center"><Briefcase className="mr-2 h-5 w-5 text-accent" />Experience</h4>
                                <ul className="pl-7 text-sm text-muted-foreground space-y-2">
                                  {resumeAnalysis.experience.map((exp, i) => (
                                    <li key={i}>
                                      <span className="font-medium">{exp.jobTitle}</span> at {exp.company} ({exp.duration})
                                      <ul className="list-disc list-inside pl-4">
                                        {exp.responsibilities.map((r, j) => <li key={j}>{r}</li>)}
                                      </ul>
                                    </li>
                                  )).length > 0 ? resumeAnalysis.experience.map((exp, i) => (
                                    <li key={i}>
                                      <span className="font-medium">{exp.jobTitle}</span> at {exp.company} ({exp.duration})
                                      <ul className="list-disc list-inside pl-4">
                                        {exp.responsibilities.map((r, j) => <li key={j}>{r}</li>)}
                                      </ul>
                                    </li>
                                  )) : <li>Not available</li>}
                                </ul>
                              </div>
                              <Separator />
                              <div>
                                <h4 className="font-semibold flex items-center"><BookOpen className="mr-2 h-5 w-5 text-accent" />Education</h4>
                                 <ul className="pl-7 text-sm text-muted-foreground space-y-1">
                                  {resumeAnalysis.education.map((edu, i) => <li key={i}><span className="font-medium">{edu.degree}</span> in {edu.fieldOfStudy} from {edu.institution} ({edu.graduationYear})</li>).length > 0 ? resumeAnalysis.education.map((edu, i) => <li key={i}><span className="font-medium">{edu.degree}</span> in {edu.fieldOfStudy} from {edu.institution} ({edu.graduationYear})</li>) : <li>Not available</li>}
                                </ul>
                              </div>
                              <Separator />
                              <div>
                                <h4 className="font-semibold flex items-center"><Award className="mr-2 h-5 w-5 text-accent" />Certifications</h4>
                                 <ul className="list-disc list-inside pl-7 text-sm text-muted-foreground">
                                  {resumeAnalysis.certifications.map((cert, i) => <li key={i}>{cert}</li>).length > 0 ? resumeAnalysis.certifications.map((cert, i) => <li key={i}>{cert}</li>) : <li>Not available</li>}
                                </ul>
                              </div>
                            </div>
                          ) : (
                            !isLoadingResume && <p className="text-sm text-muted-foreground">Upload and analyze your resume to see your anonymized profile here.</p>
                          )}
                          </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            {selectedJob ? (
                <JobDetails job={selectedJob} onBack={() => setSelectedJob(null)} />
            ) : (
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
                          <CardFooter className="gap-2 justify-center">
                            <Button variant="default" size="sm" onClick={() => setSelectedJob({ ...job, id: `rec-${index}` })}>
                                Know More
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleFindSimilar(job.title)}>
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
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
}

export default withAuth(UserProfilePage, ['user', 'admin']);
