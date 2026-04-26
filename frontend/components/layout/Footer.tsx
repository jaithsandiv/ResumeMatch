import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-dim bg-bg-surface">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo footer.svg" width={84} height={84} alt="ResumeMatch" />
            <span className="font-semibold text-text-primary text-sm">ResumeMatch</span>
          </Link>
          <p className="text-text-muted text-xs font-mono">
            AI-powered skill gap analysis
          </p>
          <p className="text-text-muted text-xs font-mono">
            © {year} ResumeMatch
          </p>
        </div>
      </div>
    </footer>
  );
}
