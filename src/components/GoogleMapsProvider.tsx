
'use client';

import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

const GoogleMapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <div className="flex items-center justify-center h-full bg-muted">
                <div className="text-center p-8 bg-background rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-destructive mb-2">Google Maps API Key is Missing</h2>
                    <p className="text-muted-foreground">
                        Please add your Google Maps API key to the environment variables to use this feature.
                        <br />
                        You can get a key from the Google Cloud Console. The Maps platform has a generous free tier.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <APIProvider apiKey={apiKey}>
            {children}
        </APIProvider>
    );
};

export default GoogleMapsProvider;
