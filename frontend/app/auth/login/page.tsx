'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.access_token);
      toast.success('Signed in');
      router.push('/profile');
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

  const inputClass = (hasError: boolean) =>
    `w-full bg-bg-elevated border rounded px-3 py-2.5 text-text-primary font-mono text-sm focus:border-accent-green focus:outline-none transition-colors placeholder:text-text-muted ${
      hasError ? 'border-accent-red' : 'border-border-dim'
    }`;

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-bg-surface border border-border-dim rounded-lg p-8">
        <div className="mb-8 text-center">
          <span className="font-mono text-2xl font-bold text-accent-green">RM</span>
          <h1 className="mt-2 text-2xl font-semibold text-text-primary font-sans">Sign in</h1>
          <p className="mt-1 text-sm text-text-secondary">Access your ResumeMatch dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider font-mono text-text-secondary mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className={inputClass(!!error)}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-mono text-text-secondary mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={inputClass(!!error)}
            />
          </div>

          {error && (
            <p className="text-accent-red text-sm font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-green text-bg-base font-semibold py-2.5 rounded hover:bg-accent-green/90 transition font-mono text-sm disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-accent-green hover:underline font-mono">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
