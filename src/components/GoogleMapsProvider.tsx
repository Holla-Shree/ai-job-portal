'use client';
import { APIProvider, ControlPosition } from '@vis.gl/react-google-maps';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable. Map functionality will be limited.");
    return (
      <Card className="w-full h-full flex flex-col items-center justify-center">
        <CardHeader>
          <CardTitle className="font-headline text-destructive">Map Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Google Maps API key is not configured. Please contact support or set the 
            <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> environment variable.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <APIProvider apiKey={apiKey}>{children}</APIProvider>;
}
