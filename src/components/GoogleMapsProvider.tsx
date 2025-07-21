
'use client';
import { APIProvider } from '@vis.gl/react-google-maps';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from './ui/button';
import Link from 'next/link';

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey === '') {
    return (
      <Card className="w-full h-full flex flex-col items-center justify-center bg-background shadow-none border-none">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-destructive">Map Unavailable</CardTitle>
          <CardDescription className="pt-2">A Google Maps API key is required to use this feature.</CardDescription>
        </CardHeader>
        <CardContent className="text-center max-w-md space-y-4">
          <p className="text-sm text-muted-foreground">
            To enable the map, please create a project in the Google Cloud Console, enable the "Maps JavaScript API", and add your API key to the <code>.env</code> file as <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
          </p>
          <p className="text-xs text-muted-foreground">
            The Google Maps Platform provides a generous free monthly credit, which is sufficient for most development and small-scale applications.
          </p>
          <Button asChild variant="link">
            <Link href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
              Go to Google Cloud Console
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <APIProvider apiKey={apiKey}>{children}</APIProvider>;
}
