import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';

// Use a consistent secret for local testing
const getJwtSecret = () => {
  if (typeof process !== 'undefined' && process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  // Local development secret - DO NOT use in production
  return 'local-dev-secret-do-not-use-in-production-' + 'x'.repeat(32);
};

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  iat: number; // issued at
  exp: number; // expiration
  scope: string[]; // permissions
  jti?: string; // JWT ID for tracking
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
}

// Generate access token (short-lived, 15 minutes)
export async function generateAccessToken(
  userId: string,
  email: string,
  scope: string[] = ['read', 'write']
): Promise<string> {
  const secret = new TextEncoder().encode(getJwtSecret());

  const jwt = await new SignJWT({
    sub: userId,
    email,
    scope,
    jti: nanoid(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);

  return jwt;
}

// Generate refresh token (long-lived, 30 days)
export async function generateRefreshToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(getJwtSecret());

  const jwt = await new SignJWT({
    sub: userId,
    jti: nanoid(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);

  return jwt;
}

// Verify and decode token
export async function verifyToken<T = JWTPayload>(token: string): Promise<T> {
  const secret = new TextEncoder().encode(getJwtSecret());

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch {
    throw new Error('Invalid token');
  }
}

// Generate both tokens
export async function generateTokenPair(userId: string, email: string) {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(userId, email),
    generateRefreshToken(userId),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
    tokenType: 'Bearer',
  };
}
