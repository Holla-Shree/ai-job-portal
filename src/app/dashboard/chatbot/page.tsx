

'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Send, Sparkles, Brain, BookOpen, Lightbulb, Plus, Trash2, Edit, Save, X, PanelLeft, Star } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { interviewPreparationChatbot, InterviewPreparationInput, InterviewPreparationOutput } from '@/ai/flows/interview-preparation';
import { generateInterviewQuestions } from '@/ai/flows/question-generator';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const chatInputSchema = z.object({
  jobDescription: z.string().min(10, "Job description is required to get suggestions."),
  interviewQuestion: z.string().min(5, "Interview question is too short."),
  userAnswer: z.string().min(1, "Your answer is required."),
});
type ChatInputFormValues = z.infer<typeof chatInputSchema>;

interface BaseMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
}

interface TextMessage extends BaseMessage {
  type: 'question' | 'answer' | 'error';
  content: string;
}

interface AnalysisMessage extends BaseMessage {
  type: 'analysis';
  content: InterviewPreparationOutput;
}

type ChatMessage = TextMessage | AnalysisMessage;

interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    jobDescription: string;
    timestamp: number;
}

const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 5) return "text-yellow-500";
    return "text-red-500";
};

const AnalysisComponent = ({ score, analysis, suggestedImprovements, relevantCourses }: InterviewPreparationOutput) => (
    <div className="space-y-3">
        <div>
            <h4 className="font-semibold text-sm flex items-center justify-between">
                <span className="flex items-center"><Star className="w-4 h-4 mr-1.5 text-primary" />Your Score:</span>
                <span className={cn("font-bold text-lg", getScoreColor(score))}>{score.toFixed(1)}/10</span>
            </h4>
        </div>
         <Separator />
        <div>
        <h4 className="font-semibold text-sm flex items-center"><Brain className="w-4 h-4 mr-1.5 text-primary" />Analysis:</h4>
        <p className="text-xs">{analysis}</p>
        </div>
        <div>
        <h4 className="font-semibold text-sm flex items-center"><Sparkles className="w-4 h-4 mr-1.5 text-primary" />Suggested Improvements:</h4>
        <p className="text-xs">{suggestedImprovements}</p>
        </div>
        {relevantCourses && (
        <div>
            <h4 className="font-semibold text-sm flex items-center"><BookOpen className="w-4 h-4 mr-1.5 text-primary" />Relevant Courses:</h4>
            <p className="text-xs">{relevantCourses}</p>
        </div>
        )}
    </div>
);


export default function ChatbotPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const form = useForm<ChatInputFormValues>({
    resolver: zodResolver(chatInputSchema),
  });

  // Load sessions from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    try {
        const storedSessions = localStorage.getItem('chatSessions');
        if (storedSessions) {
            const parsedSessions = JSON.parse(storedSessions);
            setSessions(parsedSessions);
            if (parsedSessions.length > 0) {
                // Sort by most recent and activate
                const sorted = [...parsedSessions].sort((a,b) => b.timestamp - a.timestamp);
                setActiveSessionId(sorted[0].id);
            }
        }
    } catch (error) {
        console.error("Failed to load sessions from localStorage", error);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if(isClient) {
      localStorage.setItem('chatSessions', JSON.stringify(sessions));
    }
  }, [sessions, isClient]);
  
  // Scroll to bottom of messages on new message or loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSessionId, isLoading, sessions]);

  // Update form when active session changes
  useEffect(() => {
    const activeSession = sessions.find(s => s.id === activeSessionId);
    if (activeSession) {
      form.setValue('jobDescription', activeSession.jobDescription);
      const lastQuestion = activeSession.messages.findLast(m => m.type === 'question')?.content as string;
      if (lastQuestion) {
        form.setValue('interviewQuestion', lastQuestion);
      }
    } else {
      form.reset({ jobDescription: '', interviewQuestion: '', userAnswer: '' });
    }
  }, [activeSessionId, sessions, form]);
  
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const chatHistory = activeSession ? activeSession.messages : [];

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: `Practice Session ${sessions.length + 1}`,
      messages: [],
      jobDescription: '',
      timestamp: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    form.reset({ jobDescription: '', interviewQuestion: '', userAnswer: '' });
    toast({ title: "New Session Started", description: "Ready for a new interview practice."});
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
    toast({ title: "Session Deleted" });
  };
  
  const handleRenameSession = () => {
    if (!editingSessionId || !editingTitle.trim()) return;
    setSessions(prev => prev.map(s => s.id === editingSessionId ? { ...s, title: editingTitle.trim() } : s));
    setEditingSessionId(null);
    setEditingTitle('');
    toast({ title: "Session Renamed" });
  };

  const handleChatSubmit: SubmitHandler<ChatInputFormValues> = async (data) => {
    if (!activeSessionId) {
      toast({ variant: "destructive", title: "No Active Session", description: "Please start a new session first." });
      return;
    }
    setIsLoading(true);

    const userQuestion: TextMessage = { id: `q-${Date.now()}`, sender: 'system', content: data.interviewQuestion, type: 'question' };
    const userAnswer: TextMessage = { id: `a-${Date.now()}`, sender: 'user', content: data.userAnswer, type: 'answer' };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...s.messages, userQuestion, userAnswer], jobDescription: data.jobDescription };
      }
      return s;
    }));

    try {
      const result = await interviewPreparationChatbot(data);
      const botMessage: AnalysisMessage = { id: `bot-${Date.now()}`, sender: 'bot', content: result, type: 'analysis' };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, botMessage] } : s));
      toast({ title: "Feedback Received", description: "AI has analyzed your answer." });
      form.setValue('userAnswer', '');
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: TextMessage = { id: `err-${Date.now()}`, sender: 'system', content: "Sorry, I encountered an error. Please try again.", type: 'error' };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, errorMessage] } : s));
      toast({ variant: "destructive", title: "Error", description: "Failed to get feedback." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggestQuestions = async () => {
    const jobDescription = form.getValues("jobDescription");
    if (!jobDescription || jobDescription.length < 10) {
       form.trigger("jobDescription");
       toast({ variant: "destructive", title: "Job Description Needed", description: "Please provide a job description first." });
       return;
    }
    setIsGeneratingQuestions(true);
    setSuggestedQuestions([]);
    setIsQuestionDialogOpen(true);
    try {
        const result = await generateInterviewQuestions({ jobDescription });
        setSuggestedQuestions(result.questions);
    } catch (error) {
        console.error("Error generating questions:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to suggest questions." });
        setIsQuestionDialogOpen(false);
    } finally {
        setIsGeneratingQuestions(false);
    }
  };
  
  const handleSelectQuestion = (question: string) => {
    form.setValue("interviewQuestion", question, { shouldValidate: true });
    setIsQuestionDialogOpen(false);
  };
  
  if (!isClient) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const renderMessageContent = (msg: ChatMessage) => {
    switch (msg.type) {
        case 'question':
            return <div className="w-full text-center text-xs text-muted-foreground italic p-2">Question: "{msg.content}"</div>;
        case 'analysis':
            const { score, analysis, suggestedImprovements, relevantCourses } = msg.content;
            return <AnalysisComponent score={score} analysis={analysis} suggestedImprovements={suggestedImprovements} relevantCourses={relevantCourses} />;
        case 'answer':
        case 'error':
        default:
            return msg.content;
    }
  };
  
  const sortedSessions = [...sessions].sort((a,b) => b.timestamp - a.timestamp);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] bg-muted/20">
      {/* History Sidebar */}
      <div className={cn("bg-background border-r transition-all duration-300", isSidebarOpen ? "w-64" : "w-0 overflow-hidden")}>
        <div className="flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-headline text-lg font-semibold">Chat History</h2>
            </div>
            <div className="p-2">
                 <Button variant="outline" className="w-full" onClick={handleNewSession}>
                    <Plus className="h-4 w-4 mr-2" /> New Session
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {sortedSessions.map(session => (
                        <div key={session.id} 
                             className={cn("group p-2 rounded-md cursor-pointer hover:bg-muted", activeSessionId === session.id && "bg-muted")}>
                           <div className="flex items-center justify-between" onClick={() => setActiveSessionId(session.id)}>
                             {editingSessionId === session.id ? (
                                <Input 
                                    value={editingTitle} 
                                    onChange={(e) => setEditingTitle(e.target.value)} 
                                    onKeyDown={(e) => { if(e.key === 'Enter') handleRenameSession(); if(e.key === 'Escape') setEditingSessionId(null);}}
                                    autoFocus
                                    className="h-7 text-sm"
                                />
                             ) : (
                                <p className="text-sm font-medium truncate flex-1 pr-2">{session.title}</p>
                             )}
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {editingSessionId === session.id ? (
                                    <>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRenameSession}><Save className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingSessionId(null)}><X className="h-4 w-4"/></Button>
                                    </>
                                ) : (
                                   <TooltipProvider>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setEditingSessionId(session.id); setEditingTitle(session.title); }}>
                                          <Edit className="h-4 w-4"/>
                                        </Button>
                                       </TooltipTrigger>
                                       <TooltipContent><p>Rename Session</p></TooltipContent>
                                     </Tooltip>
                                   </TooltipProvider>
                                )}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                     <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Delete Session</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete session?</AlertDialogTitle>
                                            <AlertDialogDescription>This action cannot be undone. "{session.title}" will be permanently deleted.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteSession(session.id)} className="bg-destructive hover:bg-destructive/90">Confirm Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                           </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-2 sm:p-4 md:p-6 flex-grow flex flex-col h-full">
            <Card className="w-full flex-1 flex flex-col shadow-xl bg-background">
                <CardHeader className="border-b flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                          <PanelLeft className="h-5 w-5"/>
                      </Button>
                      <div>
                          <CardTitle className="font-headline flex items-center"><MessageSquare className="mr-2 text-primary" />AI Interview Coach</CardTitle>
                          <CardDescription>Practice your interview answers and get instant AI feedback.</CardDescription>
                      </div>
                    </div>
                </CardHeader>
                
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {chatHistory.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground">
                        <MessageSquare className="w-16 h-16 mb-4" />
                        <p>Welcome to your AI Interview Coach!</p>
                        <p className="text-sm">Start a new session or select one from the history.</p>
                    </div>
                )}
                {chatHistory.map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-2", 
                        msg.sender === 'user' ? 'justify-end' : 
                        msg.sender === 'system' ? 'justify-center w-full' :
                        'justify-start'
                    )}>
                    {msg.sender === 'bot' && (
                        <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/40x40.png" alt="AI Coach" data-ai-hint="robot avatar" />
                        <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={cn('max-w-[70%] p-3 rounded-xl text-sm', {
                        'bg-primary text-primary-foreground rounded-br-none': msg.sender === 'user',
                        'bg-muted text-muted-foreground rounded-bl-none': msg.sender === 'bot',
                        'bg-transparent text-muted-foreground w-full': msg.sender === 'system',
                    })}>
                        {renderMessageContent(msg)}
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
                </div>

                <CardFooter className="border-t p-0 mt-auto">
                <form onSubmit={form.handleSubmit(handleChatSubmit)} className="w-full">
                    <div className="p-4 space-y-3 bg-muted/50">
                        <div>
                            <Label htmlFor="jobDescription" className="text-xs font-medium">Job Description</Label>
                            <Textarea id="jobDescription" {...form.register("jobDescription")} placeholder="Paste the job description here..." rows={2} className="mt-1 text-sm bg-background" disabled={!activeSessionId} />
                            {form.formState.errors.jobDescription && <p className="text-xs text-destructive mt-1">{form.formState.errors.jobDescription.message}</p>}
                        </div>
                        <div>
                            <div className="flex justify-between items-center">
                                <Label htmlFor="interviewQuestion" className="text-xs font-medium">Interview Question</Label>
                                <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="link" size="sm" className="text-primary p-0 h-auto" onClick={handleSuggestQuestions} disabled={isGeneratingQuestions || !activeSessionId}>
                                            <Lightbulb className="mr-1.5 h-3 w-3" /> Suggest Questions
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                        <DialogTitle>Suggested Questions</DialogTitle>
                                        <DialogDescription>
                                            Here are some questions tailored to the job description. Click one to start practicing.
                                        </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                        {isGeneratingQuestions ? (
                                            <div className="flex items-center justify-center h-24">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            </div>
                                        ) : (
                                            <ul className="space-y-2 max-h-64 overflow-y-auto">
                                                {suggestedQuestions.map((q, i) => (
                                                <li key={i}>
                                                    <Button variant="outline" className="w-full h-auto text-wrap text-left justify-start" onClick={() => handleSelectQuestion(q)}>
                                                        {q}
                                                    </Button>
                                                </li>
                                                ))}
                                            </ul>
                                        )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Input id="interviewQuestion" {...form.register("interviewQuestion")} placeholder="e.g., Tell me about yourself." className="mt-1 text-sm bg-background" disabled={!activeSessionId}/>
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
                        className="flex-1 resize-none text-sm bg-background"
                        disabled={isLoading || !activeSessionId}
                        onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            form.handleSubmit(handleChatSubmit)();
                        }
                        }}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !activeSessionId}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Send Answer</span>
                    </Button>
                    </div>
                    {form.formState.errors.userAnswer && <p className="px-4 pb-2 text-xs text-destructive">{form.formState.errors.userAnswer.message}</p>}
                </form>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
