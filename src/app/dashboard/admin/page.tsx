
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, FileText, BarChart2, Activity } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import withAuth from '@/components/withAuth';

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

function AdminPanelPage() {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

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

            {/* Charts */}
            <div className="grid gap-8 md:grid-cols-2 mb-8">
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
                                <YAxis dataKey="service" type="category" tickLine={false} axisLine={false} tickMargin={8} className="text-xs"/>
                                <XAxis type="number" hide />
                                <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar dataKey="count" layout="vertical" fill="var(--color-count)" radius={4} />
                            </BarChart>
                        </ChartContainer>
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
