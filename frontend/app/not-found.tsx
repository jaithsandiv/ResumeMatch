import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg-base px-6 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(0, 229, 160, 0.05), transparent 60%)',
        }}
      />

      <div className="relative text-center max-w-md animate-fade-in-up">
        <p
          aria-hidden="true"
          className="font-mono text-gradient-green opacity-30 text-[10rem] select-none leading-none font-bold"
        >
          404
        </p>
        <h1 className="text-text-primary text-3xl font-bold tracking-tight mt-2">Page not found</h1>
        <p className="text-text-secondary text-sm mt-3 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-accent-green text-bg-base font-semibold px-5 py-2.5 rounded-lg text-sm hover:brightness-110 transition-all"
          >
            <Home size={14} />
            Go home
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-text-secondary border border-border-dim px-5 py-2.5 rounded-lg text-sm hover:border-border-bright hover:text-text-primary transition-colors"
          >
            <Search size={14} />
            Browse Jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
