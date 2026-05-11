'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { setToken, isAdmin } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import Image from 'next/image';
import { handleApiError } from '@/lib/apiError';
import { Home, Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.access_token);
      toast.success('Signed in successfully');
      router.push(isAdmin() ? '/admin' : '/profile');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(detail ?? 'Invalid email or password');
      if (status !== 401) {
        handleApiError(err, toast, { silent401: true, fallback: 'Login failed' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0, 229, 160, 0.08), transparent 60%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(79, 142, 247, 0.06), transparent 60%)',
        }}
      />

      <div className="w-full max-w-md relative animate-fade-in-up">
        <div className="flex justify-end mb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-secondary text-xs font-mono transition-colors px-2 py-1 rounded hover:bg-bg-surface"
          >
            <Home size={13} />
            Homepage
          </Link>
        </div>

        <div className="bg-bg-surface border border-border-dim rounded-2xl p-8 shadow-elevated">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-3">
              <Image src="/logo footer.svg" width={120} height={120} alt="ResumeMatch" priority />
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-text-secondary">Sign in to your ResumeMatch account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider font-mono text-text-secondary mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className={`w-full bg-bg-elevated border rounded-lg pl-9 pr-3 py-2.5 text-text-primary text-sm focus:outline-none transition-colors placeholder:text-text-muted ${
                    error ? 'border-accent-red/60' : 'border-border-dim focus:border-accent-green/60'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-mono text-text-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={`w-full bg-bg-elevated border rounded-lg pl-9 pr-10 py-2.5 text-text-primary text-sm focus:outline-none transition-colors placeholder:text-text-muted ${
                    error ? 'border-accent-red/60' : 'border-border-dim focus:border-accent-green/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary p-1 rounded transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-accent-red/30 bg-accent-red/5 px-3 py-2.5">
                <p className="text-accent-red text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-green text-bg-base font-semibold py-2.5 rounded-lg hover:brightness-110 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-glow-green/0 hover:shadow-glow-green"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border-dim" />
            <span className="text-text-muted text-xs font-mono">or</span>
            <div className="flex-1 h-px bg-border-dim" />
          </div>

          <p className="text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-accent-green hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
