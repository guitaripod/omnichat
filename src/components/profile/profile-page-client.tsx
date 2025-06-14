'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfileContent from '@/components/profile/profile-content';
import { useDevMode } from '@/hooks/use-dev-mode';

export default function ProfilePageClient() {
  const isDevMode = useDevMode();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isDevMode && isLoaded && !user) {
      router.push('/auth/sign-in');
    }
  }, [isDevMode, isLoaded, user, router]);

  if (!isDevMode && !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (!isDevMode && !user) {
    return null;
  }

  // Create a mock user for dev mode
  const mockUser = isDevMode
    ? {
        id: 'dev-user',
        firstName: 'Dev',
        lastName: 'User',
        primaryEmailAddress: { emailAddress: 'dev@example.com' },
        emailAddresses: [{ emailAddress: 'dev@example.com' }],
        createdAt: new Date(),
      }
    : user;

  return <ProfileContent user={mockUser as any} />;
}
