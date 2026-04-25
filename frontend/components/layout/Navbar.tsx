'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { getUser, clearToken, isAdmin } from '@/lib/auth';

interface NavUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const initials =
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2);
  return (
    <span className="text-sm font-semibold font-mono text-bg-base uppercase">
      {initials.toUpperCase()}
    </span>
  );
}

const NAV_LINKS = [
  { href: '/', label: 'Jobs' },
  { href: '/profile', label: 'Profile' },
];

function isLinkActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const [user, setUser] = useState<NavUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearToken();
    router.push('/auth/login');
  }

  const links = user && isAdmin()
    ? [...NAV_LINKS, { href: '/admin', label: 'Admin' }]
    : NAV_LINKS;

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 h-16 bg-bg-surface border-b border-border-dim">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-accent-green font-mono font-bold text-lg leading-none">
              RM
            </span>
            <span className="font-sans font-semibold text-text-primary text-base">
              ResumeMatch
            </span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-6">
            {links.map((link) => {
              const active = isLinkActive(link.href, pathname);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={clsx(
                      'text-sm font-medium transition-colors duration-150 pb-0.5',
                      active
                        ? 'text-text-primary border-b-2 border-accent-green'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="w-8 h-8 rounded-full bg-accent-green flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent-green/50"
                    aria-label="User menu"
                  >
                    <Initials name={user.full_name || user.email} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="min-w-44 bg-bg-elevated border border-border-dim rounded-lg shadow-xl py-1 z-50"
                  >
                    <div className="px-3 py-2 border-b border-border-dim mb-1">
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/profile"
                        className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-base cursor-pointer outline-none"
                      >
                        Profile
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={handleLogout}
                      className="flex items-center px-3 py-2 text-sm text-accent-red hover:bg-bg-base cursor-pointer outline-none"
                    >
                      Logout
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm bg-accent-green text-bg-base font-semibold px-3 py-1.5 rounded-md hover:brightness-110 transition-all"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-text-secondary hover:text-text-primary"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu — slides down directly under the fixed navbar */}
      {mobileOpen && (
        <div className="md:hidden fixed top-16 inset-x-0 z-49 bg-bg-surface border-b border-border-dim p-4 space-y-1">
          {links.map((link) => {
            const active = isLinkActive(link.href, pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                  active
                    ? 'text-text-primary bg-bg-elevated'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-border-dim mt-2 space-y-1">
            {user ? (
              <>
                <p className="px-3 text-xs text-text-muted pb-1">{user.email}</p>
                <Link
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm text-accent-red hover:bg-bg-elevated"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-3 py-2 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
