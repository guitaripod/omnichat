import Link from 'next/link';

export const runtime = 'edge';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <h1 className="mb-4 text-6xl font-bold text-gray-900 dark:text-white">404</h1>
      <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">Page not found</p>
      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Go Home
      </Link>
    </div>
  );
}
