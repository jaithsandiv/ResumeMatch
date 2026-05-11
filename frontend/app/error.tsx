'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCw, Home, AlertTriangle } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg-base px-6 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(240, 96, 96, 0.06), transparent 60%)',
        }}
      />

      <div className="relative text-center max-w-md animate-fade-in-up">
        <div className="relative inline-block mb-6">
          <p
            aria-hidden="true"
            className="font-mono text-accent-red/15 text-[10rem] select-none leading-none font-bold"
          >
            ERR
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-accent-red/15 border border-accent-red/30 flex items-center justify-center">
              <AlertTriangle size={28} className="text-accent-red" />
            </div>
          </div>
        </div>
        <h1 className="text-text-primary text-3xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-text-secondary text-sm mt-3 mb-8 leading-relaxed">
          An unexpected error occurred. You can try again or head back to the home page.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 bg-accent-green text-bg-base font-semibold px-5 py-2.5 rounded-lg text-sm hover:brightness-110 transition-all"
          >
            <RotateCw size={14} />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-text-secondary border border-border-dim px-5 py-2.5 rounded-lg text-sm hover:border-border-bright hover:text-text-primary transition-colors"
          >
            <Home size={14} />
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
