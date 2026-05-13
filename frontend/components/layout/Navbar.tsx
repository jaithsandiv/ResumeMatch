'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Image from 'next/image';
import { Menu, X, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
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
    <span className="text-[13px] font-semibold font-mono text-bg-base uppercase tracking-tight">
      {initials.toUpperCase()}
    </span>
  );
}

const NAV_LINKS = [
  { href: '/', label: 'Jobs' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/profile', label: 'Profile' },
];

function isLinkActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const [user, setUser] = useState<NavUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleLogout() {
    clearToken();
    router.push('/auth/login');
  }

  const links = user
    ? [
        ...NAV_LINKS,
        ...(isAdmin() ? [{ href: '/admin', label: 'Admin' }] : []),
      ]
    : [{ href: '/', label: 'Jobs' }, { href: '/about', label: 'About' }, { href: '/contact', label: 'Contact' }];

  return (
    <>
      <nav
        className={clsx(
          'fixed top-0 inset-x-0 z-50 h-16 transition-all duration-300',
          scrolled
            ? 'glass-surface border-b border-border-dim shadow-soft'
            : 'bg-bg-surface/80 border-b border-border-dim/60 backdrop-blur-md'
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="relative">
              <Image
                src="/logo.svg"
                width={30}
                height={30}
                alt="ResumeMatch"
                className="transition-transform group-hover:scale-105"
              />
            </div>
            <span className="font-sans font-semibold text-text-primary text-[15px] tracking-tight">
              ResumeMatch
            </span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const active = isLinkActive(link.href, pathname);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={clsx(
                      'relative text-sm font-medium px-3 py-2 rounded-md transition-colors duration-150',
                      active
                        ? 'text-text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40'
                    )}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-accent-green" />
                    )}
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
                    className="w-9 h-9 rounded-full bg-linear-to-br from-accent-green to-accent-green-soft flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:ring-offset-2 focus:ring-offset-bg-base transition-transform hover:scale-105 shadow-glow-green"
                    aria-label="User menu"
                  >
                    <Initials name={user.full_name || user.email} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={10}
                    className="min-w-56 bg-bg-elevated border border-border-dim rounded-xl shadow-elevated py-1.5 z-50 animate-fade-in"
                  >
                    <div className="px-3.5 py-2.5 border-b border-border-dim mb-1">
                      <p className="text-text-primary text-sm font-medium truncate">
                        {user.full_name || 'Account'}
                      </p>
                      <p className="text-xs text-text-muted truncate font-mono mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:bg-bg-base hover:text-text-primary cursor-pointer outline-none transition-colors"
                      >
                        <UserIcon size={14} />
                        Profile
                      </Link>
                    </DropdownMenu.Item>
                    {isAdmin() && (
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:bg-bg-base hover:text-text-primary cursor-pointer outline-none transition-colors"
                        >
                          <ShieldCheck size={14} />
                          Admin Panel
                        </Link>
                      </DropdownMenu.Item>
                    )}
                    <div className="my-1 border-t border-border-dim" />
                    <DropdownMenu.Item
                      onSelect={handleLogout}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-accent-red hover:bg-accent-red/10 cursor-pointer outline-none transition-colors"
                    >
                      <LogOut size={14} />
                      Logout
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-md"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm bg-accent-green text-bg-base font-semibold px-4 py-1.5 rounded-md hover:brightness-110 transition-all shadow-glow-green/0 hover:shadow-glow-green"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-text-secondary hover:text-text-primary p-1.5 rounded-md hover:bg-bg-elevated/40 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu — slides down directly under the fixed navbar */}
      {mobileOpen && (
        <div className="md:hidden fixed top-16 inset-x-0 z-49 glass-surface border-b border-border-dim p-4 space-y-1 animate-fade-in shadow-soft">
          {links.map((link) => {
            const active = isLinkActive(link.href, pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  active
                    ? 'text-text-primary bg-bg-elevated border border-border-dim'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60'
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-border-dim mt-3 space-y-1">
            {user ? (
              <>
                <p className="px-3 text-xs text-text-muted pb-1 font-mono truncate">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg text-sm text-accent-red hover:bg-accent-red/10 transition-colors"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold bg-accent-green text-bg-base text-center hover:brightness-110 transition-all"
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
