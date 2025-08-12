
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
                        You can get a key from the Google Cloud Console. The Maps platform has a generous free tier, but still requires a key.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <APIProvider 
            apiKey={apiKey}
            onLoad={() => console.log('Maps API loaded.')}
            // The vis.gl library doesn't have a direct onError prop on APIProvider.
            // A common pattern is to wrap the Map component itself to catch errors,
            // but for a billing error, it's often a console error.
            // A robust solution would involve window error listeners, but for now,
            // we will rely on the developer seeing the console error and our message below.
        >
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-destructive/90 text-destructive-foreground p-4 rounded-md shadow-lg hidden only:block">
                <h3 className="font-bold">Map Error: Billing Not Enabled</h3>
                <p className="text-sm">
                    The Google Maps API key is correct, but billing is not enabled for the associated Google Cloud project.
                    Please visit the Google Cloud Console to enable billing.
                </p>
            </div>
            {children}
        </APIProvider>
    );
};

export default GoogleMapsProvider;
