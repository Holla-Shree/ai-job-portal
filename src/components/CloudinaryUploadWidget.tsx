
'use client';

import { CldUploadWidget } from 'next-cloudinary';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CloudinaryUploadWidgetProps {
  onSuccess: (result: any) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  children: React.ReactNode;
}

export function CloudinaryUploadWidget({
  onSuccess,
  isUploading,
  setIsUploading,
  children,
}: CloudinaryUploadWidgetProps) {
  const { toast } = useToast();

  const handleUploadSuccess = (result: any) => {
    setIsUploading(false);
    onSuccess(result);
  };

  const handleUploadError = (error: any) => {
    setIsUploading(false);
    console.error('Cloudinary upload error:', error);
    toast({
      title: 'Upload Failed',
      description: 'Something went wrong during the upload. Please try again.',
      variant: 'destructive',
    });
  };

  return (
    <CldUploadWidget
      signatureEndpoint="/api/sign-cloudinary-params" // This endpoint needs to be created for signed uploads
      uploadPreset="unsigned_preset" // Using an unsigned preset for simplicity. Create one in your Cloudinary settings.
      onSuccess={handleUploadSuccess}
      onError={handleUploadError}
      onUpload={(result) => setIsUploading(true)}
      options={{
        folder: 'profile-pictures',
        clientAllowedFormats: ['png', 'gif', 'jpeg'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
      }}
    >
      {({ open }) => {
        return (
          <div onClick={() => open()} className="cursor-pointer w-full">
            {isUploading ? (
              <Button variant="outline" className="w-full" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </Button>
            ) : (
              children
            )}
          </div>
        );
      }}
    </CldUploadWidget>
  );
}
