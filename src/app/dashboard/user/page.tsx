
'use client';
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserCircle, Search, MessageSquare, Settings, ListChecks } from "lucide-react";
import withAuth from '@/components/withAuth';
import { useAuth } from '@/contexts/AuthContext';

const dashboardItems = [
  {
    icon: <UserCircle className="h-10 w-10 text-primary" />,
    title: "My Profile & Resume",
    description: "Upload and analyze your resume to create a powerful, anonymized profile for recruiters.",
    link: "/dashboard/user/settings/profile",
    linkText: "Update Profile"
  },
  {
    icon: <Search className="h-10 w-10 text-primary" />,
    title: "AI Job Recommendations",
    description: "Discover jobs tailored to you. Let our AI find the best matches based on your skills and experience.",
    link: "/dashboard/user/settings/profile", 
    linkText: "Get Recommendations"
  },
  {
    icon: <ListChecks className="h-10 w-10 text-primary" />,
    title: "My Applications",
    description: "Track the status of all your job applications and manage your job-seeking journey in one place.",
    link: "/dashboard/user/applications",
    linkText: "View Applications"
    },
  {
    icon: <MessageSquare className="h-10 w-10 text-primary" />,
    title: "Interview Prep Chatbot",
    description: "Practice makes perfect. Use our AI chatbot to sharpen your skills and get instant feedback.",
    link: "/dashboard/chatbot",
    linkText: "Start Practicing"
  },
];

function UserDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">
          Welcome, <span className="text-primary">Job Seeker!</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
          This is your personal dashboard. From here, you can manage your profile, find job matches, and prepare for interviews.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
        {dashboardItems.map((item) => (
          <Card key={item.title} className="group flex flex-col shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
            <CardHeader className="flex flex-row items-center gap-4">
              {item.icon}
              <div>
                <CardTitle className="font-headline text-2xl">{item.title}</CardTitle>
                <CardDescription className="mt-1">{item.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow"></CardContent>
            <div className="p-6 pt-0">
               <Button asChild className="w-full">
                <Link href={item.link}>
                  {item.linkText}
                  <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default withAuth(UserDashboardPage, ['user', 'admin']);
