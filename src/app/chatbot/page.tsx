'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Send, Sparkles, Brain, BookOpen } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { interviewPreparationChatbot, InterviewPreparationInput, InterviewPreparationOutput } from '@/ai/flows/interview-preparation';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const chatInputSchema = z.object({
  jobDescription: z.string().min(10, "Job description is too short."),
  interviewQuestion: z.string().min(5, "Interview question is too short."),
  userAnswer: z.string().min(1, "Your answer is required."),
});
type ChatInputFormValues = z.infer<typeof chatInputSchema>;

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  content: string | React.ReactNode;
  type?: 'question' | 'answer' | 'analysis';
}

export default function ChatbotPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentJobDesc, setCurrentJobDesc] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const form = useForm<ChatInputFormValues>({
    resolver: zodResolver(chatInputSchema),
  });

  useEffect(() => {
    // Scroll to bottom when new messages are added or loading state changes
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const handleChatSubmit: SubmitHandler<ChatInputFormValues> = async (data) => {
    setIsLoading(true);
    setCurrentJobDesc(data.jobDescription);
    setCurrentQuestion(data.interviewQuestion);

    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', content: `My answer to "${data.interviewQuestion}": ${data.userAnswer}`, type: 'answer' };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const aiInput: InterviewPreparationInput = {
        jobDescription: data.jobDescription,
        interviewQuestion: data.interviewQuestion,
        userAnswer: data.userAnswer,
      };
      const result = await interviewPreparationChatbot(aiInput);
      
      const botResponseContent = (
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm flex items-center"><Brain className="w-4 h-4 mr-1.5 text-primary" />Analysis:</h4>
            <p className="text-xs">{result.analysis}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm flex items-center"><Sparkles className="w-4 h-4 mr-1.5 text-primary" />Suggested Improvements:</h4>
            <p className="text-xs">{result.suggestedImprovements}</p>
          </div>
          {result.relevantCourses && (
            <div>
              <h4 className="font-semibold text-sm flex items-center"><BookOpen className="w-4 h-4 mr-1.5 text-primary" />Relevant Courses:</h4>
              <p className="text-xs">{result.relevantCourses}</p>
            </div>
          )}
        </div>
      );

      const botMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'bot', content: botResponseContent, type: 'analysis' };
      setChatHistory(prev => [...prev, botMessage]);
      
      toast({ title: "Feedback Received", description: "AI has analyzed your answer." });
      form.setValue('userAnswer', ''); // Clear user answer input

    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'system', content: "Sorry, I encountered an error. Please try again." };
      setChatHistory(prev => [...prev, errorMessage]);
      toast({ variant: "destructive", title: "Error", description: "Failed to get feedback." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const startNewSession = () => {
    setChatHistory([]);
    setCurrentJobDesc("");
    setCurrentQuestion("");
    form.reset();
    toast({ title: "New Session Started", description: "Ready for a new interview practice."});
  };

  return (
    <div className="h-screen w-screen p-4 sm:p-6 md:p-8 flex flex-col">
      <Card className="container mx-auto flex-1 flex flex-col shadow-xl overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="font-headline flex items-center"><MessageSquare className="mr-2 text-primary" />AI Interview Coach</CardTitle>
          <CardDescription>Practice your interview answers and get instant AI feedback.</CardDescription>
        </CardHeader>
        
        <ScrollArea className="flex-1 p-0 min-h-0">
          <CardContent className="p-6 space-y-4">
          {chatHistory.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center pt-16">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Enter job details and a question to start practicing.</p>
            </div>
          )}
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'bot' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40.png" alt="AI Coach" data-ai-hint="robot avatar" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[70%] p-3 rounded-xl text-sm ${
                msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 
                msg.sender === 'bot' ? 'bg-muted text-muted-foreground rounded-bl-none' :
                'bg-destructive/20 text-destructive-foreground border border-destructive rounded-md'
              }`}>
                {msg.content}
              </div>
               {msg.sender === 'user' && (
                <Avatar className="h-8 w-8">
                   <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="person avatar" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://placehold.co/40x40.png" alt="AI Coach" data-ai-hint="robot avatar" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="max-w-[70%] p-3 rounded-lg bg-muted text-muted-foreground rounded-bl-none">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          </CardContent>
        </ScrollArea>

        <CardFooter className="border-t p-0">
          <form onSubmit={form.handleSubmit(handleChatSubmit)} className="w-full">
            <div className="p-4 space-y-3 bg-background/50">
                <div>
                    <Label htmlFor="jobDescription" className="text-xs font-medium">Job Description</Label>
                    <Textarea id="jobDescription" {...form.register("jobDescription")} placeholder="Paste the job description here..." rows={2} className="mt-1 text-sm" />
                    {form.formState.errors.jobDescription && <p className="text-xs text-destructive mt-1">{form.formState.errors.jobDescription.message}</p>}
                </div>
                <div>
                    <Label htmlFor="interviewQuestion" className="text-xs font-medium">Interview Question</Label>
                    <Input id="interviewQuestion" {...form.register("interviewQuestion")} placeholder="e.g., Tell me about yourself." className="mt-1 text-sm" suppressHydrationWarning={true} />
                    {form.formState.errors.interviewQuestion && <p className="text-xs text-destructive mt-1">{form.formState.errors.interviewQuestion.message}</p>}
                </div>
            </div>
            <Separator />
            <div className="p-4 flex items-center gap-2">
              <Textarea
                id="userAnswer"
                {...form.register("userAnswer")}
                placeholder="Type your answer here..."
                rows={1}
                className="flex-1 resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    form.handleSubmit(handleChatSubmit)();
                  }
                }}
              />
              <Button type="submit" size="icon" disabled={isLoading} suppressHydrationWarning={true}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send Answer</span>
              </Button>
              <Button type="button" variant="outline" onClick={startNewSession} disabled={isLoading} suppressHydrationWarning={true}>
                New Session
              </Button>
            </div>
             {form.formState.errors.userAnswer && <p className="px-4 pb-2 text-xs text-destructive">{form.formState.errors.userAnswer.message}</p>}
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
