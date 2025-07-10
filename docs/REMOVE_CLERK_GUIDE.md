# Guide: Removing Clerk and Implementing Custom Authentication

This guide provides step-by-step instructions for removing Clerk from the OmniChat web application and implementing a custom authentication system that leverages the existing JWT-based API authentication.

## Why Remove Clerk?

1. **Unified Authentication**: Use the same auth system for web, CLI, and API clients
2. **No Interference**: Clerk's aggressive middleware blocks external auth flows
3. **Cost Savings**: No subscription fees
4. **Full Control**: Complete control over auth flows and user experience
5. **Existing Infrastructure**: The API already has a robust JWT auth system with Apple Sign In

## Current State

### What We Have (API Side)

- ✅ JWT token generation and validation
- ✅ Refresh token system
- ✅ Apple Sign In endpoint (`/api/v1/auth/apple`)
- ✅ User profile endpoint (`/api/v1/user/profile`)
- ✅ Token refresh endpoint (`/api/v1/auth/refresh`)
- ✅ Secure password hashing
- ✅ Database tables for users, auth providers, and refresh tokens

### What Clerk Provides (Web Side)

- User sessions in the web app
- Protected route middleware
- Sign in/up UI components
- User context hooks
- Session management

## Removal Steps

### Phase 1: Remove Clerk Dependencies

1. **Remove Clerk packages**

   ```bash
   npm uninstall @clerk/nextjs @clerk/types
   ```

2. **Remove environment variables**
   Delete from `.env.local` and Cloudflare Pages settings:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
   - `CLERK_WEBHOOK_SECRET`

### Phase 2: Remove Clerk Code

1. **Delete Clerk provider**

   ```bash
   rm src/components/providers/clerk-provider.tsx
   ```

2. **Update root layout** (`src/app/layout.tsx`)

   ```diff
   - import { ClerkProvider } from '@/components/providers/clerk-provider';

   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>
   -       <ClerkProvider>
   -         <UserDataProvider>
   -           <MigrationErrorBoundary>{children}</MigrationErrorBoundary>
   -         </UserDataProvider>
   -       </ClerkProvider>
   +       <AuthProvider>
   +         <UserDataProvider>
   +           <MigrationErrorBoundary>{children}</MigrationErrorBoundary>
   +         </UserDataProvider>
   +       </AuthProvider>
         </body>
       </html>
     );
   }
   ```

3. **Update middleware** (`src/middleware.ts`)

   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { verifyJWT } from '@/lib/auth/jwt';

   export async function middleware(req: NextRequest) {
     // Handle CORS
     if (req.method === 'OPTIONS') {
       return new NextResponse(null, { status: 200, headers: corsHeaders });
     }

     // Check authentication for protected routes
     if (isProtectedRoute(req)) {
       const token = req.cookies.get('auth-token')?.value;

       if (!token) {
         return NextResponse.redirect(new URL('/sign-in', req.url));
       }

       try {
         await verifyJWT(token);
       } catch {
         return NextResponse.redirect(new URL('/sign-in', req.url));
       }
     }

     return NextResponse.next();
   }
   ```

4. **Remove Clerk hooks usage**
   Search and replace all instances of:
   - `useUser()` → `useAuth()`
   - `useClerk()` → Remove
   - `useAuth()` from Clerk → `useAuth()` from custom provider
   - `<SignIn />` → Custom sign in component
   - `<SignUp />` → Custom sign up component
   - `<UserButton />` → Custom user menu

### Phase 3: Implement Custom Auth

1. **Create auth context** (`src/components/providers/auth-provider.tsx`)

   ```typescript
   'use client';

   import { createContext, useContext, useEffect, useState } from 'react';
   import { useRouter } from 'next/navigation';

   interface User {
     id: string;
     email: string;
     name?: string;
     tier: string;
   }

   interface AuthContextType {
     user: User | null;
     loading: boolean;
     signIn: (email: string, password: string) => Promise<void>;
     signInWithApple: () => Promise<void>;
     signOut: () => Promise<void>;
     refreshToken: () => Promise<void>;
   }

   const AuthContext = createContext<AuthContextType | null>(null);

   export function AuthProvider({ children }: { children: React.ReactNode }) {
     const [user, setUser] = useState<User | null>(null);
     const [loading, setLoading] = useState(true);
     const router = useRouter();

     useEffect(() => {
       // Check for existing session
       checkAuth();
     }, []);

     const checkAuth = async () => {
       try {
         const response = await fetch('/api/v1/user/profile', {
           credentials: 'include',
         });

         if (response.ok) {
           const userData = await response.json();
           setUser(userData);
         }
       } catch (error) {
         console.error('Auth check failed:', error);
       } finally {
         setLoading(false);
       }
     };

     const signIn = async (email: string, password: string) => {
       // Implement email/password sign in
       const response = await fetch('/api/v1/auth/signin', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email, password }),
         credentials: 'include',
       });

       if (response.ok) {
         const { user } = await response.json();
         setUser(user);
         router.push('/chat');
       } else {
         throw new Error('Sign in failed');
       }
     };

     const signInWithApple = async () => {
       // Redirect to Apple Sign In
       window.location.href = '/api/v1/auth/apple/web';
     };

     const signOut = async () => {
       await fetch('/api/v1/auth/signout', {
         method: 'POST',
         credentials: 'include',
       });
       setUser(null);
       router.push('/');
     };

     const refreshToken = async () => {
       const response = await fetch('/api/v1/auth/refresh', {
         method: 'POST',
         credentials: 'include',
       });

       if (response.ok) {
         await checkAuth();
       } else {
         await signOut();
       }
     };

     return (
       <AuthContext.Provider
         value={{ user, loading, signIn, signInWithApple, signOut, refreshToken }}
       >
         {children}
       </AuthContext.Provider>
     );
   }

   export const useAuth = () => {
     const context = useContext(AuthContext);
     if (!context) {
       throw new Error('useAuth must be used within AuthProvider');
     }
     return context;
   };
   ```

2. **Create sign in page** (`src/app/sign-in/page.tsx`)

   ```typescript
   'use client';

   import { useState } from 'react';
   import { useAuth } from '@/components/providers/auth-provider';

   export default function SignInPage() {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [error, setError] = useState('');
     const { signIn, signInWithApple } = useAuth();

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       try {
         await signIn(email, password);
       } catch (err) {
         setError('Invalid email or password');
       }
     };

     return (
       <div className="flex min-h-screen items-center justify-center">
         <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
           <h1 className="text-2xl font-bold">Sign In</h1>

           {error && (
             <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
           )}

           <input
             type="email"
             placeholder="Email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             className="w-full p-2 border rounded"
             required
           />

           <input
             type="password"
             placeholder="Password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             className="w-full p-2 border rounded"
             required
           />

           <button
             type="submit"
             className="w-full bg-blue-500 text-white p-2 rounded"
           >
             Sign In
           </button>

           <button
             type="button"
             onClick={signInWithApple}
             className="w-full bg-black text-white p-2 rounded"
           >
             Sign in with Apple
           </button>
         </form>
       </div>
     );
   }
   ```

3. **Add cookie-based session management**

   ```typescript
   // In API routes, set secure HTTP-only cookies
   const token = generateJWT(userId);
   const response = NextResponse.json({ success: true });

   response.cookies.set('auth-token', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 60 * 60 * 24 * 7, // 7 days
   });
   ```

### Phase 4: API Updates

1. **Add web-specific auth endpoints**

   - `/api/v1/auth/signin` - Email/password sign in
   - `/api/v1/auth/signout` - Clear session cookies
   - `/api/v1/auth/apple/web` - Apple Sign In for web (redirects to Apple)
   - `/api/v1/auth/apple/callback` - Apple callback for web

2. **Update CORS configuration**
   Ensure cookies work properly:
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL,
     'Access-Control-Allow-Credentials': 'true',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
   };
   ```

### Phase 5: Testing

1. **Test all auth flows**

   - Email/password sign in
   - Apple Sign In
   - Sign out
   - Protected route access
   - Token refresh
   - Session persistence

2. **Test external clients**
   - CLI with Apple Sign In
   - API direct access with JWT
   - Mobile app authentication

## Benefits After Migration

1. **Unified Auth System**: One auth system for all clients
2. **No Subscription Costs**: Save on Clerk fees
3. **Full Control**: Customize auth flows as needed
4. **Better External Support**: CLI and mobile apps work seamlessly
5. **Simpler Architecture**: No middleware conflicts

## Implementation Timeline

- **Phase 1-2**: 1 day (Remove Clerk)
- **Phase 3-4**: 2-3 days (Implement custom auth)
- **Phase 5**: 1 day (Testing)
- **Total**: ~5 days

## Important Notes

1. **Database**: You already have all necessary tables (users, authProviders, refreshTokens)
2. **Security**: Use HTTP-only cookies for web sessions, JWT for API
3. **Apple Sign In**: Configure separate redirect URLs for web vs CLI
4. **Migration**: Existing users will need to sign in again after migration
