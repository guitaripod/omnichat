import { ReactNode } from 'react';

export default function ImagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <main className="flex-1">{children}</main>
    </div>
  );
}
