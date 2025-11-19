
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Briefcase, Users, Brain, MessageCircle, FileText, UploadCloud, Search, ArrowRight, Loader2, Map as MapIcon } from "lucide-react";
import Image from "next/image";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: <Search className="h-10 w-10 text-primary" />,
    title: "AI Job Recommendations",
    description: "Get job suggestions perfectly matched to your skills and preferences using advanced AI.",
    link: "/login",
    linkText: "Find Jobs"
  },
  {
    icon: <UploadCloud className="h-10 w-10 text-primary" />,
    title: "Smart Resume Parsing",
    description: "Upload your resume and let our AI extract key information to build your profile instantly.",
    link: "/signup",
    linkText: "Sign Up & Upload"
  },
  {
    icon: <MessageCircle className="h-10 w-10 text-primary" />,
    title: "Interview Prep Chatbot",
    description: "Practice interview questions and get AI-powered feedback to ace your next interview.",
    link: "/dashboard/chatbot",
    linkText: "Start Practicing"
  },
  {
    icon: <MapIcon className="h-10 w-10 text-primary" />,
    title: "Interactive Job Map",
    description: "Visualize job openings in your desired location and explore opportunities geographically.",
    link: "/map",
    linkText: "Explore Map"
  }
];

const Step1Icon = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 130" className="mt-4 rounded-md">
    <g fill="none" stroke="hsl(var(--foreground))" strokeWidth="2">
      {/* Document */}
      <path d="M50 10 H120 V120 H50 Z" fill="hsl(var(--card))" />
      <path d="M60 30 H110" />
      <path d="M60 45 H110" />
      <path d="M60 60 H90" />
      <path d="M60 75 H110" />
      <path d="M60 90 H100" />
      
      {/* Arrow */}
      <path d="M125 65 H155" strokeWidth="3" stroke="hsl(var(--primary))"/>
      <path d="M145 55 L155 65 L145 75" strokeWidth="3" stroke="hsl(var(--primary))"/>

      {/* Brain/AI */}
      <g transform="translate(160, 50)">
        <path d="M15 0 C 25 0, 30 5, 30 15 S 25 30, 15 30 C 5 30, 0 25, 0 15 S 5 0, 15 0 Z" fill="hsl(var(--secondary))" stroke="hsl(var(--primary))"/>
        <path d="M15 5 C 12 10, 12 20, 15 25" stroke="hsl(var(--primary))"/>
        <path d="M10 8 C 5 15, 5 20, 10 27" stroke="hsl(var(--primary))"/>
        <path d="M20 8 C 25 15, 25 20, 20 27" stroke="hsl(var(--primary))"/>
      </g>
    </g>
  </svg>
);

const Step2Icon = () => (
    <svg width="100%" height="100%" viewBox="0 0 200 130" className="mt-4 rounded-md">
    <g fill="none" stroke="hsl(var(--foreground))" strokeWidth="2">
      {/* Candidate Profile */}
      <circle cx="50" cy="65" r="20" fill="hsl(var(--secondary))" />
      <path d="M30 95 C 30 80, 70 80, 70 95 Z" fill="hsl(var(--secondary))" />

      {/* Dashed line */}
      <path d="M80 65 H120" strokeDasharray="4 4" stroke="hsl(var(--muted-foreground))"/>
      
      {/* Job Icon */}
      <rect x="130" y="45" width="40" height="40" rx="5" fill="hsl(var(--secondary))" />
      <path d="M140 55 H160" />
      <path d="M140 65 H155" />
      <path d="M140 75 H160" />

      {/* Sparkles for matching */}
      <g fill="hsl(var(--primary))" stroke="none">
          <path d="M95 50 L100 45 L105 50 L100 55 Z" />
          <path d="M110 75 L115 70 L120 75 L115 80 Z" />
          <path d="M85 80 L90 75 L95 80 L90 85 Z" />
      </g>
    </g>
  </svg>
);

const Step3Icon = () => (
    <svg width="100%" height="100%" viewBox="0 0 200 130" className="mt-4 rounded-md">
    <g fill="none" stroke="hsl(var(--foreground))" strokeWidth="2">
      {/* Chat bubble */}
      <path d="M40 30 H110 V80 H70 L60 95 V80 H40 Z" fill="hsl(var(--card))" />
      <path d="M50 45 H100" />
      <path d="M50 60 H80" />

      {/* Arrow path */}
       <path d="M120 60 C 140 30, 160 30, 180 60" strokeDasharray="4 4" stroke="hsl(var(--primary))"/>
       <path d="M175 50 L180 60 L170 60" fill="hsl(var(--primary))" stroke="none"/>

      {/* Growth chart */}
      <path d="M40 120 V90 H160" stroke="hsl(var(--muted-foreground))" />
      <path d="M60 110 L80 100 L100 105 L120 95 L140 100" stroke="hsl(var(--primary))" strokeWidth="3"/>
    </g>
  </svg>
);


export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      switch (user.role) {
        case 'user':
          router.replace('/dashboard/user');
          break;
        case 'recruiter':
          router.replace('/dashboard/recruiter');
          break;
        case 'admin':
          router.replace('/dashboard/admin');
          break;
        default:
          // Stay on the landing page if role is unknown
          break;
      }
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <AppHeader />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center bg-background">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <Briefcase className="h-20 w-20 text-primary mx-auto mb-6" />
              <h1 className="font-headline text-5xl md:text-6xl font-bold mb-6">
                Welcome to <span className="text-primary">AI JobPortal</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10">
                Your intelligent partner in navigating the job market. Discover opportunities, enhance your skills, and land your dream job with the power of AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="shadow-lg hover:shadow-primary/50 transition-shadow">
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-accent/50 transition-shadow">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-16">
              Why Choose <span className="text-primary">AI JobPortal</span>?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center shadow-xl hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1 bg-card">
                  <CardHeader>
                    <div className="mb-4 flex justify-center">{feature.icon}</div>
                    <CardTitle className="font-headline text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-6 text-base">{feature.description}</CardDescription>
                    <Button asChild variant="link" className="text-primary">
                      <Link href={feature.link}>{feature.linkText} &rarr;</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-16">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">1</div>
                    <CardTitle className="font-headline text-xl">Upload & Analyze</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Job seekers upload resumes, our AI parses skills and experience. Recruiters post detailed job descriptions.</p>
                  <Step1Icon />
                </CardContent>
              </Card>
              <Card className="shadow-lg">
                <CardHeader>
                   <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">2</div>
                    <CardTitle className="font-headline text-xl">AI Matching</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Our intelligent algorithms match candidates to jobs based on deep analysis of requirements and profiles.</p>
                  <Step2Icon />
                </CardContent>
              </Card>
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">3</div>
                    <CardTitle className="font-headline text-xl">Connect & Grow</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Connect with opportunities, prepare with our AI chatbot, and track your application progress seamlessly.</p>
                  <Step3Icon />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </main>
      <AppFooter />
    </div>
  );
}
