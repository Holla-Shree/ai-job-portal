'use client';
import { APIProvider } from '@vis.gl/react-google-maps';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey === '') {
    return (
      <Card className="w-full h-full flex flex-col items-center justify-center bg-background shadow-none border-none">
        <CardHeader>
          <CardTitle className="font-headline text-destructive">Map Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center max-w-sm">
            A valid Google Maps API key is not configured. Please set the{' '}
            <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> variable in your <code>.env</code>{' '}
            file to view the map.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <APIProvider apiKey={apiKey}>{children}</APIProvider>;
}
