import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ProfileContent from '@/components/profile/profile-content';

export const runtime = 'edge';

export default async function ProfilePage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Authentication not configured</p>
      </div>
    );
  }

  const user = await currentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  return <ProfileContent user={user} />;
}
