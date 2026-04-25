'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg-base px-6">
      <p
        aria-hidden="true"
        className="font-mono text-accent-red opacity-20 text-9xl select-none leading-none"
      >
        ERR
      </p>
      <h1 className="text-text-primary text-2xl font-semibold mt-2">Something went wrong</h1>
      <p className="text-text-secondary text-sm mt-2 mb-6 max-w-md text-center">
        An unexpected error occurred. You can try again or head back to the home page.
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="bg-accent-green text-bg-base font-semibold px-5 py-2.5 rounded-lg text-sm hover:brightness-110 transition-all"
        >
          Try again
        </button>
        <Link href="/" className="text-accent-blue text-sm hover:underline">
          ← Go home
        </Link>
      </div>
    </main>
  );
}
