'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Briefcase, PlusCircle, Sparkles } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateJobDescription } from '@/ai/flows/job-description-generator';

// Main form schema
const jobPostingSchema = z.object({
  jobTitle: z.string().min(3, "Job title must be at least 3 characters."),
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  location: z.string().min(2, "Location is required."),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters."),
  responsibilities: z.string().optional(),
  qualifications: z.string().optional(),
  salaryRange: z.string().optional(),
});
type JobPostingFormValues = z.infer<typeof jobPostingSchema>;

// AI Generator form schema
const generatorSchema = z.object({
  jobTitle: z.string().min(3, "Job title is required to generate a description."),
  notes: z.string().optional(),
});
type GeneratorFormValues = z.infer<typeof generatorSchema>;

export default function RecruiterPortalPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  // Main form for posting the job
  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingSchema),
  });

  // Form for the AI generator dialog
  const generatorForm = useForm<GeneratorFormValues>({
    resolver: zodResolver(generatorSchema),
  });
  
  // Sync job title from main form to generator form when dialog opens
  React.useEffect(() => {
    if (isGeneratorOpen) {
      const currentJobTitle = form.getValues("jobTitle");
      if (currentJobTitle) {
        generatorForm.setValue("jobTitle", currentJobTitle);
      }
    }
  }, [isGeneratorOpen, form, generatorForm]);

  const handleJobPost: SubmitHandler<JobPostingFormValues> = async (data) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Job Posting Data:", data);
    toast({ title: "Job Posted!", description: `The job "${data.jobTitle}" has been successfully posted.` });
    form.reset(); // Reset form after successful submission
    setIsSubmitting(false);
  };
  
  const handleGenerateDescription: SubmitHandler<GeneratorFormValues> = async (data) => {
    setIsGenerating(true);
    try {
      const result = await generateJobDescription({
        jobTitle: data.jobTitle,
        notes: data.notes,
      });
      if (result.jobDescription) {
        form.setValue("jobDescription", result.jobDescription, { shouldValidate: true });
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


  return (
    <ScrollArea className="h-[calc(100vh-theme(spacing.32))]">
    <div className="container mx-auto py-8">
      <h1 className="font-headline text-3xl font-bold mb-8 text-primary">Recruiter Job Portal</h1>
      
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><PlusCircle className="mr-2 text-primary" /> Post a New Job</CardTitle>
          <CardDescription>Fill in the details below to publish a job listing.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(handleJobPost)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input id="jobTitle" {...form.register("jobTitle")} placeholder="e.g., Senior Software Engineer" className="mt-1" />
                {form.formState.errors.jobTitle && <p className="text-sm text-destructive mt-1">{form.formState.errors.jobTitle.message}</p>}
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" {...form.register("companyName")} placeholder="e.g., Tech Solutions Inc." className="mt-1" />
                {form.formState.errors.companyName && <p className="text-sm text-destructive mt-1">{form.formState.errors.companyName.message}</p>}
              </div>
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...form.register("location")} placeholder="e.g., San Francisco, CA or Remote" className="mt-1" />
              {form.formState.errors.location && <p className="text-sm text-destructive mt-1">{form.formState.errors.location.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="jobDescription">Job Description</Label>
                <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="link" size="sm" className="text-primary p-0 h-auto">
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      Generate with AI
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={generatorForm.handleSubmit(handleGenerateDescription)}>
                      <DialogHeader>
                        <DialogTitle>Generate Job Description</DialogTitle>
                        <DialogDescription>
                          Provide a job title and any key notes, and the AI will draft a description for you.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="genJobTitle" className="text-right">
                            Job Title
                          </Label>
                          <Input
                            id="genJobTitle"
                            {...generatorForm.register("jobTitle")}
                            className="col-span-3 mt-1"
                          />
                          {generatorForm.formState.errors.jobTitle && <p className="text-sm text-destructive mt-1">{generatorForm.formState.errors.jobTitle.message}</p>}
                        </div>
                        <div>
                          <Label htmlFor="genNotes" className="text-right">
                            Keywords / Notes (Optional)
                          </Label>
                          <Textarea
                            id="genNotes"
                            {...generatorForm.register("notes")}
                            placeholder="e.g., 5+ years experience, proficient in React, works on fintech products..."
                            className="col-span-3 mt-1"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isGenerating}>
                          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Generate
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <Textarea id="jobDescription" {...form.register("jobDescription")} rows={5} placeholder="Provide a detailed description of the job role, or generate one with AI." className="mt-1" />
              {form.formState.errors.jobDescription && <p className="text-sm text-destructive mt-1">{form.formState.errors.jobDescription.message}</p>}
            </div>

            <div>
              <Label htmlFor="responsibilities">Key Responsibilities (Optional)</Label>
              <Textarea id="responsibilities" {...form.register("responsibilities")} rows={3} placeholder="List key responsibilities, one per line..." className="mt-1" />
            </div>

            <div>
              <Label htmlFor="qualifications">Qualifications (Optional)</Label>
              <Textarea id="qualifications" {...form.register("qualifications")} rows={3} placeholder="List required qualifications, one per line..." className="mt-1" />
            </div>

            <div>
              <Label htmlFor="salaryRange">Salary Range (Optional)</Label>
              <Input id="salaryRange" {...form.register("salaryRange")} placeholder="e.g., $120,000 - $150,000 per year" className="mt-1" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Briefcase className="mr-2 h-4 w-4" />}
              Post Job
            </Button>
          </CardFooter>
        </form>
      </Card>
      {/* Future: Add a section to view/manage posted jobs */}
    </div>
    </ScrollArea>
  );
}
