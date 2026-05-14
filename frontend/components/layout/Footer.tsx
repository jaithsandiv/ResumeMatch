import Image from 'next/image';
import Link from 'next/link';
import { Mail, Heart, Info } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-dim bg-bg-surface relative overflow-hidden">
      {/* Subtle ambient gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0, 229, 160, 0.04), transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto px-6 py-12 relative">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 mb-10">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <Image
                src="/logo.svg"
                width={28}
                height={28}
                alt="ResumeMatch"
                className="transition-transform group-hover:scale-105"
              />
              <span className="font-sans font-semibold text-text-primary text-base">
                ResumeMatch
              </span>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              AI-powered skill gap analysis for every application, find your perfect match.
            </p>
          </div>

          {/* Navigate column */}
          <div>
            <h4 className="text-text-primary text-xs font-mono uppercase tracking-wider mb-4">
              Navigate
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '/', label: 'Jobs' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
                { href: '/profile', label: 'Profile' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary text-sm hover:text-accent-green transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect column */}
          <div>
            <h4 className="text-text-primary text-xs font-mono uppercase tracking-wider mb-4">
              Connect
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-text-secondary text-sm hover:text-accent-green transition-colors"
                >
                  <Mail size={14} />
                  Get in touch
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-text-secondary text-sm hover:text-accent-green transition-colors"
                >
                  <Info size={14} />
                  About the project
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider + bottom row */}
        <div className="pt-6 border-t border-border-dim flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-text-muted text-xs font-mono">
            © {year} ResumeMatch — All rights reserved
          </p>
          <p className="text-text-muted text-xs font-mono inline-flex items-center gap-1.5">
            Built for job seekers
          </p>
        </div>
      </div>
    </footer>
  );
}
