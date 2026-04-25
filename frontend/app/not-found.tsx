import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg-base px-6">
      <p
        aria-hidden="true"
        className="font-mono text-accent-green opacity-20 text-9xl select-none leading-none"
      >
        404
      </p>
      <h1 className="text-text-primary text-2xl font-semibold mt-2">Page not found</h1>
      <p className="text-text-secondary text-sm mt-2 mb-6">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="text-accent-blue text-sm hover:underline">
        ← Go home
      </Link>
    </main>
  );
}
