import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URI = 'https://appleid.apple.com/auth/keys';

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

// Verify Apple ID token
export async function verifyAppleIdToken(idToken: string, clientId: string): Promise<AppleIdToken> {
  // Decode token header to get the key ID
  const decodedToken = jwt.decode(idToken, { complete: true });
  if (!decodedToken || typeof decodedToken === 'string') {
    throw new Error('Invalid token format');
  }

  const keyId = decodedToken.header.kid;
  if (!keyId) {
    throw new Error('No key ID found in token');
  }

  // Get Apple's public key
  const client = new JwksClient({
    jwksUri: APPLE_JWKS_URI,
    cache: true,
    rateLimit: true,
  });

  const key = await client.getSigningKey(keyId);
  const signingKey = key.getPublicKey();

  // Verify and decode the token
  const payload = jwt.verify(idToken, signingKey, {
    issuer: APPLE_ISSUER,
    audience: clientId,
    algorithms: ['RS256'],
  }) as AppleIdToken;

  return payload;
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
  const decoded = jwt.decode(idToken) as AppleIdToken;

  if (!decoded) {
    throw new Error('Invalid token');
  }

  // Basic validation
  if (decoded.aud !== clientId) {
    throw new Error('Invalid audience');
  }

  if (decoded.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }

  return decoded;
}
