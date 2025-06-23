// Edge-compatible Apple ID token verification

export interface AppleIdToken {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string; // Apple user ID
  email?: string;
  email_verified?: string;
  is_private_email?: string;
  real_user_status?: number;
  transfer_sub?: string;
  nonce?: string;
  nonce_supported?: boolean;
  auth_time?: number;
}

// In production, this would verify the token with Apple's servers
// For now, we'll use a simple decode for development
export async function verifyAppleIdToken(idToken: string, clientId: string): Promise<AppleIdToken> {
  // In development, just decode without verification
  if (process.env.NODE_ENV === 'development') {
    return mockVerifyAppleIdToken(idToken, clientId);
  }

  // In production, you would:
  // 1. Fetch Apple's public keys from https://appleid.apple.com/auth/keys
  // 2. Verify the JWT signature
  // 3. Validate claims (iss, aud, exp)
  throw new Error('Apple ID token verification not implemented for production');
}

// Extract user info from Apple token
export function extractUserInfo(appleToken: AppleIdToken) {
  return {
    appleUserId: appleToken.sub,
    email: appleToken.email,
    emailVerified: appleToken.email_verified === 'true',
    isPrivateEmail: appleToken.is_private_email === 'true',
  };
}

// Mock verification for local testing
export async function mockVerifyAppleIdToken(
  idToken: string,
  clientId: string
): Promise<AppleIdToken> {
  // For local testing, decode without verification
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(atob(parts[1]));

    // Basic validation
    if (payload.aud !== clientId) {
      throw new Error('Invalid audience');
    }

    if (payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    return payload as AppleIdToken;
  } catch {
    throw new Error('Invalid token');
  }
}
