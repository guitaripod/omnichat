import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@/components/providers/clerk-provider';
import { UserDataProvider } from '@/components/providers/user-data-provider';
import { MigrationErrorBoundary } from '@/components/migration-error-boundary';
import { ThemeScript } from './theme-script';
import './globals.css';

export const runtime = 'edge';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'OmniChat - Multi-LLM Chat Application',
  description:
    'Chat with multiple AI models including OpenAI, Anthropic, Google, and local Ollama models',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <UserDataProvider>
            <MigrationErrorBoundary>{children}</MigrationErrorBoundary>
          </UserDataProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
