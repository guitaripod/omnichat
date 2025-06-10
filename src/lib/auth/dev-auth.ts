// Dev mode authentication utilities

export function isDevMode() {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true';
}

export async function getDevUser() {
  if (!isDevMode()) return null;

  // Return a minimal user object that matches what we need
  // We only return what we actually use in the app
  return {
    id: 'dev-user',
    primaryEmailAddress: { emailAddress: 'dev@localhost' },
    fullName: 'Dev User',
    username: 'devuser',
    imageUrl: '',
  };
}
