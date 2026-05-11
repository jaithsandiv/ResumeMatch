import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-dim bg-bg-surface">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col items-center gap-4">
          <Link href="/" className="flex justify-center">
            <Image src="/logo footer.svg" width={168} height={168} alt="ResumeMatch" />
          </Link>
          <p className="text-text-muted text-xs font-mono">
            AI-powered skill gap analysis
          </p>
          <Link
            href="/contact"
            className="text-accent-green text-xs font-mono hover:underline"
          >
            Contact Us
          </Link>
          <Link
            href="/about"
            className="text-accent-green text-xs font-mono hover:underline"
          >
            About Us
          </Link>
          <p className="text-text-muted text-xs font-mono">
            © {year} ResumeMatch
          </p>
        </div>
      </div>
    </footer>
  );
}
