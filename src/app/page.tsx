
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Briefcase, Users, Brain, MapPin, MessageCircle, FileText, UploadCloud, Search, ArrowRight } from "lucide-react";
import Image from "next/image";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: <Search className="h-10 w-10 text-primary" />,
    title: "AI Job Recommendations",
    description: "Get job suggestions perfectly matched to your skills and preferences using advanced AI.",
    link: "/dashboard/user",
    linkText: "Find Jobs"
  },
  {
    icon: <UploadCloud className="h-10 w-10 text-primary" />,
    title: "Smart Resume Parsing",
    description: "Upload your resume and let our AI extract key information to build your profile instantly.",
    link: "/dashboard/user",
    linkText: "Upload Resume"
  },
  {
    icon: <MessageCircle className="h-10 w-10 text-primary" />,
    title: "Interview Prep Chatbot",
    description: "Practice interview questions and get AI-powered feedback to ace your next interview.",
    link: "/chatbot",
    linkText: "Start Practicing"
  },
  {
    icon: <MapPin className="h-10 w-10 text-primary" />,
    title: "Interactive Job Map",
    description: "Visualize job opportunities in your desired locations with our interactive map search.",
    link: "/map",
    linkText: "Explore Map"
  },
];

export default function HomePage() {
  const { user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'user': return '/dashboard/user';
      case 'recruiter': return '/dashboard/recruiter';
      case 'admin': return '/dashboard/admin';
      default: return '/login';
    }
  };

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
                Welcome to <span className="text-primary">JobMatch AI</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10">
                Your intelligent partner in navigating the job market. Discover opportunities, enhance your skills, and land your dream job with the power of AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="shadow-lg hover:shadow-primary/50 transition-shadow">
                  <Link href="/login">I'm a Job Seeker</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-accent/50 transition-shadow">
                  <Link href="/login">I'm a Recruiter</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-16">
              Why Choose <span className="text-primary">JobMatch AI</span>?
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
                   <Image src="https://placehold.co/600x400.png" alt="Upload and Analyze" width={600} height={400} className="mt-4 rounded-md" data-ai-hint="resume upload" />
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
                  <Image src="https://placehold.co/600x400.png" alt="AI Matching" width={600} height={400} className="mt-4 rounded-md" data-ai-hint="connections network" />
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
                  <Image src="https://placehold.co/600x400.png" alt="Connect and Grow" width={600} height={400} className="mt-4 rounded-md" data-ai-hint="career growth" />
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
