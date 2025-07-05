import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

export const runtime = 'edge';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OmniChat - 3rd Place T3 Cloneathon',
  description: '3rd Place Winner in T3 Cloneathon - Multi-LLM Chat Interface',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
