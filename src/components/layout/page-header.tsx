'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, backTo = '/chat', children }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(backTo)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        </div>
        {children && <div className="flex items-center gap-4">{children}</div>}
      </div>
    </div>
  );
}
