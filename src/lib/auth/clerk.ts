import { currentUser, auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db/client';
import { createUser, getUserByClerkId } from '@/lib/db/queries';

export async function getOrCreateUser(db: ReturnType<typeof getDb>) {
  const user = await currentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Check if user exists in database
  let dbUser = await getUserByClerkId(db, user.id);

  // Create user if doesn't exist
  if (!dbUser) {
    dbUser = await createUser(db, {
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
      imageUrl: user.imageUrl || undefined,
    });
  }

  return dbUser;
}

export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return userId;
}
