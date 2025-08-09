
'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, FileText, BarChart2, Activity, Bot, Send, Loader2, Eraser, Search, MoreVertical, Trash2, Eye, UserX, Download } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import withAuth from '@/components/withAuth';
import { adminDataQuery } from '@/ai/flows/admin-data-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useNotifications, Candidate, Recruiter } from '@/contexts/NotificationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const userGrowthChartConfig = {
  users: {
    label: "Users",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const aiUsageChartConfig = {
    count: {
        label: "Count",
        color: "hsl(var(--accent))",
    }
} satisfies ChartConfig;

interface ChatMessage {
    id: string;
    sender: 'user' | 'bot';
    content: string;
}

type CombinedUser = (Candidate | Recruiter) & { role: 'Candidate' | 'Recruiter'; dateJoined: string; status: 'Active' | 'Suspended'; email?: string; };


function AdminPanelPage() {
    const { toast } = useToast();
    const { candidates, jobs, applicationHistory, recruiters } = useNotifications();
    const [isClient, setIsClient] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [userSearch, setUserSearch] = useState('');

    const MOCK_STATS = useMemo(() => ({
        totalUsers: candidates.length + recruiters.length,
        totalJobs: jobs.length,
        totalApplications: applicationHistory.length,
        resumesParsed: candidates.filter(c => c.profile && !c.profile.startsWith('Newly registered')).length,
    }), [candidates, jobs, applicationHistory, recruiters]);

    const MOCK_USER_GROWTH_DATA = [
        { month: 'Jan', users: 12 },
        { month: 'Feb', users: 25 },
        { month: 'Mar', users: 41 },
        { month: 'Apr', users: 68 },
        { month: 'May', users: 99 },
        { month: 'Jun', users: candidates.length },
    ];

    const MOCK_AI_USAGE_DATA = [
        { service: 'Resume Parsing', count: MOCK_STATS.resumesParsed },
        { service: 'Job Recs', count: 350 },
        { service: 'Screening', count: 880 },
        { service: 'Chatbot', count: 1200 },
    ];

    const allUsers: CombinedUser[] = useMemo(() => {
        const candidateUsers = candidates.map(c => ({...c, role: 'Candidate', dateJoined: '2024-06-15', status: 'Active' as const }));
        const recruiterUsers = recruiters.map(r => ({...r, role: 'Recruiter', dateJoined: '2024-05-20', status: 'Active' as const }));
        return [...candidateUsers, ...recruiterUsers];
    }, [candidates, recruiters]);

    const filteredUsers = useMemo(() => {
        if (!userSearch) return allUsers;
        return allUsers.filter(u => 
            (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
        );
    }, [allUsers, userSearch]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', content: chatInput };
        setChatHistory(prev => [...prev, userMessage]);
        setChatInput('');
        setIsChatLoading(true);

        try {
            const { answer } = await adminDataQuery({ query: chatInput });
            const botMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'bot', content: answer };
            setChatHistory(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Admin chatbot error:', error);
            const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'bot', content: 'Sorry, I encountered an error while fetching the data.' };
            setChatHistory(prev => [...prev, errorMessage]);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not get an answer from the AI assistant.',
            });
        } finally {
            setIsChatLoading(false);
        }
    };
    
    const handleClearChat = () => {
        setChatHistory([]);
        toast({ title: 'Chat Cleared', description: 'You can start a new conversation now.' });
    };

    const handleDownloadReport = (reportName: string) => {
        toast({
            title: 'Report Generating...',
            description: `Your report "${reportName}" will be downloaded shortly.`,
        });
        // In a real app, this would trigger a CSV export function.
        console.log(`Downloading ${reportName}...`);
    };

    if (!isClient) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="font-headline text-3xl font-bold mb-8 text-primary">Admin Dashboard</h1>

             <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-6">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="users">User Management</TabsTrigger>
                    <TabsTrigger value="reports">AI Monitoring & Reporting</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard">
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                        <Card className="shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{MOCK_STATS.totalUsers}</div>
                                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Jobs Posted</CardTitle>
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{MOCK_STATS.totalJobs}</div>
                                <p className="text-xs text-muted-foreground">+15 from last month</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{MOCK_STATS.totalApplications}</div>
                                <p className="text-xs text-muted-foreground">+120 this week</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">AI Resumes Parsed</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{MOCK_STATS.resumesParsed}</div>
                                <p className="text-xs text-muted-foreground">High accuracy rate</p>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="font-headline flex items-center"><BarChart2 className="mr-2"/>User Growth</CardTitle>
                                    <CardDescription>New users over the last 6 months.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={userGrowthChartConfig} className="h-[250px] w-full">
                                        <AreaChart data={MOCK_USER_GROWTH_DATA} margin={{ left: -20, right: 20, top: 5, bottom: 5 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                            <Area dataKey="users" type="natural" fill="var(--color-users)" fillOpacity={0.4} stroke="var(--color-users)" />
                                        </AreaChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="font-headline flex items-center"><BarChart2 className="mr-2"/>AI Service Usage</CardTitle>
                                    <CardDescription>Breakdown of AI features used across the platform.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={aiUsageChartConfig} className="h-[250px] w-full">
                                        <BarChart data={MOCK_AI_USAGE_DATA} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                                            <CartesianGrid horizontal={false} />
                                            <YAxis dataKey="service" type="category" tickLine={false} axisLine={false} tickMargin={8} width={100} className="text-xs"/>
                                            <XAxis type="number" hide />
                                            <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                            <Bar dataKey="count" layout="vertical" fill="var(--color-count)" radius={4} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <Card className="shadow-xl lg:col-span-1 flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline flex items-center"><Bot className="mr-2"/>AI Admin Assistant</CardTitle>
                                <CardDescription>Ask questions about platform metrics.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col p-0">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {chatHistory.length === 0 && (
                                        <div className="text-center text-sm text-muted-foreground pt-10">
                                            <p>Ask me things like:</p>
                                            <ul className="mt-2 list-none">
                                                <li>"How many users do we have?"</li>
                                                <li>"What is the total number of jobs?"</li>
                                                <li>"Which AI service is used the most?"</li>
                                            </ul>
                                        </div>
                                    )}
                                    {chatHistory.map((msg) => (
                                        <div key={msg.id} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.sender === 'bot' && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src="https://placehold.co/40x40.png" alt="AI Assistant" data-ai-hint="robot avatar" />
                                                    <AvatarFallback>AI</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                                                msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                            }`}>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                            {msg.sender === 'user' && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src="https://placehold.co/40x40.png" alt="Admin" data-ai-hint="person avatar" />
                                                    <AvatarFallback>A</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    ))}
                                    {isChatLoading && (
                                        <div className="flex items-center justify-start gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="https://placehold.co/40x40.png" alt="AI Assistant" data-ai-hint="robot avatar" />
                                                <AvatarFallback>AI</AvatarFallback>
                                            </Avatar>
                                            <div className="p-3 bg-muted rounded-lg">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                                <form onSubmit={handleChatSubmit} className="border-t p-2 flex items-center gap-2 mt-auto">
                                    <Input
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Ask about metrics..."
                                        className="flex-1"
                                        disabled={isChatLoading}
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={handleClearChat} disabled={isChatLoading || chatHistory.length === 0}>
                                        <Eraser className="w-4 h-4" />
                                        <span className="sr-only">Clear Chat</span>
                                    </Button>
                                    <Button type="submit" size="icon" disabled={isChatLoading}>
                                        {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        <span className="sr-only">Send</span>
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="users">
                    <Card className="shadow-xl">
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>View, manage, and search all users on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search by name or email..." 
                                        className="pl-8"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person avatar" />
                                                        <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{user.name || 'Unnamed User'}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant={user.role === 'Candidate' ? 'secondary' : 'outline'}>{user.role}</Badge></TableCell>
                                            <TableCell>{user.dateJoined}</TableCell>
                                            <TableCell><Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>{user.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Profile</DropdownMenuItem>
                                                        <DropdownMenuItem><UserX className="mr-2 h-4 w-4" /> Suspend</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="reports">
                    <div className="grid grid-cols-1 gap-8">
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle>AI Match Monitoring</CardTitle>
                                <CardDescription>Review and audit the outcomes of recent AI screening and recommendation tasks.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <p className="text-muted-foreground text-center py-8">AI Monitoring reports will be displayed here in a future update.</p>
                            </CardContent>
                        </Card>
                         <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle>Data Export</CardTitle>
                                <CardDescription>Download platform data as CSV files for external analysis.</CardDescription>
                            </CardHeader>
                             <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <Button variant="outline" onClick={() => handleDownloadReport('All Users Report')}>
                                    <Download className="mr-2 h-4 w-4" />
                                    All Users
                                </Button>
                                <Button variant="outline" onClick={() => handleDownloadReport('All Jobs Report')}>
                                     <Download className="mr-2 h-4 w-4" />
                                    All Jobs
                                </Button>
                                <Button variant="outline" onClick={() => handleDownloadReport('Application History Report')}>
                                     <Download className="mr-2 h-4 w-4" />
                                    Applications
                                </Button>
                                <Button variant="outline" onClick={() => handleDownloadReport('AI Usage Report')}>
                                     <Download className="mr-2 h-4 w-4" />
                                    AI Usage
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}


export default withAuth(AdminPanelPage, ['admin']);

    