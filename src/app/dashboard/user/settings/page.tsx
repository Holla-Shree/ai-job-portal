
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page just redirects to the profile settings page by default.
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/user/settings/profile');
  }, [router]);

  return null; // Or a loading spinner
}
