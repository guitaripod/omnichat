export function useDevMode() {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true';
}

export function useDevUser() {
  const isDevMode = useDevMode();

  if (!isDevMode) return null;

  return {
    id: 'dev-user',
    firstName: 'Dev',
    lastName: 'User',
    fullName: 'Dev User',
    username: 'devuser',
    emailAddresses: [{ emailAddress: 'dev@localhost' }],
    imageUrl: '',
  };
}
