
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, FileText, BarChart2, Activity, Bot, Send, Loader2, Trash2 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import withAuth from '@/components/withAuth';
import { adminDataQuery } from '@/ai/flows/admin-data-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

// Mock Data
const MOCK_STATS = {
    totalUsers: 134,
    totalJobs: 78,
    totalApplications: 452,
    resumesParsed: 215,
};

const MOCK_USER_GROWTH_DATA = [
    { month: 'Jan', users: 12 },
    { month: 'Feb', users: 25 },
    { month: 'Mar', users: 41 },
    { month: 'Apr', users: 68 },
    { month: 'May', users: 99 },
    { month: 'Jun', users: 134 },
];

const MOCK_AI_USAGE_DATA = [
    { service: 'Resume Parsing', count: 215 },
    { service: 'Job Recs', count: 350 },
    { service: 'Screening', count: 880 },
    { service: 'Chatbot', count: 1200 },
];

const MOCK_RECENT_ACTIVITY = [
    { id: 1, user: 'Priya Patel', action: 'Applied for Senior Backend Engineer', type: 'application', timestamp: '2 minutes ago' },
    { id: 2, user: 'Recruiter Admin', action: 'Posted new job: "Data Scientist"', type: 'job_posting', timestamp: '15 minutes ago' },
    { id: 3, user: 'Rohan Sharma', action: 'Uploaded a new resume', type: 'resume_upload', timestamp: '1 hour ago' },
    { id: 4, user: 'Anjali Menon', action: 'Started a new chatbot session', type: 'chatbot_session', timestamp: '3 hours ago' },
    { id: 5, user: 'Recruiter Admin', action: 'Viewed screening results for "Data Scientist"', type: 'screening', timestamp: '5 hours ago' },
    { id: 6, user: 'Vikram Singh', action: 'Registered a new account', type: 'registration', timestamp: '1 day ago' },
];

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

function AdminPanelPage() {
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

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

    const getActivityBadgeVariant = (type: string) => {
        switch (type) {
            case 'application': return 'default';
            case 'job_posting': return 'secondary';
            case 'resume_upload': return 'outline';
            case 'chatbot_session': return 'destructive';
            case 'screening': return 'secondary';
            case 'registration': return 'default';
            default: return 'outline';
        }
    };

    if (!isClient) {
        return null;
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="font-headline text-3xl font-bold mb-8 text-primary">Admin Dashboard</h1>

            {/* Stats Cards */}
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
                    {/* User Growth Chart */}
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

                    {/* AI Usage Chart */}
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
                
                {/* AI Assistant Chatbot */}
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
                                <Trash2 className="w-4 h-4" />
                                <span className="sr-only">New Chat</span>
                            </Button>
                            <Button type="submit" size="icon" disabled={isChatLoading}>
                                {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>


            {/* Recent Activity Table */}
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="font-headline">Recent Activity</CardTitle>
                    <CardDescription>A log of the latest events on the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_RECENT_ACTIVITY.map(activity => (
                                <TableRow key={activity.id}>
                                    <TableCell className="font-medium">{activity.user}</TableCell>
                                    <TableCell>{activity.action}</TableCell>
                                    <TableCell>
                                        <Badge variant={getActivityBadgeVariant(activity.type)}>{activity.type.replace('_', ' ')}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">{activity.timestamp}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}


export default withAuth(AdminPanelPage, ['admin']);
