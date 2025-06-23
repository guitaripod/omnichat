// Production Apple ID token verification
import { importSPKI, jwtVerify } from 'jose';

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URI = 'https://appleid.apple.com/auth/keys';

interface AppleKey {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

interface AppleIdToken {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  email_verified?: string;
  is_private_email?: string;
  real_user_status?: number;
  auth_time?: number;
  nonce_supported?: boolean;
}

// Cache for Apple's public keys
let keysCache: { keys: AppleKey[]; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function getApplePublicKeys(): Promise<AppleKey[]> {
  // Check cache
  if (keysCache && Date.now() - keysCache.timestamp < CACHE_DURATION) {
    return keysCache.keys;
  }

  // Fetch fresh keys
  const response = await fetch(APPLE_JWKS_URI);
  if (!response.ok) {
    throw new Error('Failed to fetch Apple public keys');
  }

  const data = await response.json();
  keysCache = {
    keys: data.keys,
    timestamp: Date.now(),
  };

  return data.keys;
}

function rsaPublicKeyToPEM(n: string, e: string): string {
  const nBuffer = Buffer.from(n, 'base64url');
  const eBuffer = Buffer.from(e, 'base64url');

  const modulusHex = nBuffer.toString('hex');
  const exponentHex = eBuffer.toString('hex');

  // Construct ASN.1 DER encoding
  const modulus = `00${modulusHex}`;
  const exponent = exponentHex;

  const rsaPublicKey = `30${getHexLength(modulus, exponent)}02${getHexLength(modulus)}${modulus}02${getHexLength(
    exponent
  )}${exponent}`;
  const publicKey = `30${getHexLength(rsaPublicKey)}0609608648016503040201050003${getHexLength(
    rsaPublicKey
  )}00${rsaPublicKey}`;

  const base64 = Buffer.from(publicKey, 'hex').toString('base64');
  const pem = `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;

  return pem;
}

function getHexLength(...args: string[]): string {
  const length = args.reduce((acc, arg) => acc + arg.length / 2, 0);
  const hexLength = length.toString(16);
  return hexLength.length % 2 === 0 ? hexLength : `0${hexLength}`;
}

export async function verifyAppleIdToken(
  idToken: string,
  clientId: string,
  options?: { nonce?: string }
): Promise<AppleIdToken> {
  try {
    // Decode the header to get the key ID
    const [headerBase64] = idToken.split('.');
    const header = JSON.parse(Buffer.from(headerBase64, 'base64url').toString());
    const { kid, alg } = header;

    if (!kid || !alg) {
      throw new Error('Invalid token header');
    }

    // Get Apple's public keys
    const keys = await getApplePublicKeys();
    const key = keys.find((k) => k.kid === kid);

    if (!key) {
      throw new Error('Public key not found');
    }

    // Convert key to PEM format
    const pem = rsaPublicKeyToPEM(key.n, key.e);
    const publicKey = await importSPKI(pem, alg);

    // Verify the token
    const { payload } = await jwtVerify(idToken, publicKey, {
      issuer: APPLE_ISSUER,
      audience: clientId,
    });

    const appleToken = payload as unknown as AppleIdToken;

    // Additional validations
    if (options?.nonce && payload.nonce !== options.nonce) {
      throw new Error('Invalid nonce');
    }

    return appleToken;
  } catch (error) {
    console.error('Apple token verification failed:', error);
    throw new Error('Invalid Apple ID token');
  }
}

export function extractUserInfo(appleToken: AppleIdToken) {
  return {
    appleUserId: appleToken.sub,
    email: appleToken.email,
    emailVerified: appleToken.email_verified === 'true',
    isPrivateEmail: appleToken.is_private_email === 'true',
    realUserStatus: appleToken.real_user_status,
  };
}