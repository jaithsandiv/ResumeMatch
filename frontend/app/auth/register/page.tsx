'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import Image from 'next/image';
import { handleApiError } from '@/lib/apiError';

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<'confirm' | 'all' | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      setFieldError('confirm');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setToken(data.access_token);
      toast.success('Account created');
      router.push('/profile');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? 'Registration failed. Please try again.');
      setFieldError('all');
      handleApiError(err, toast, { silent401: true, fallback: 'Registration failed' });
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (highlight: boolean) =>
    `w-full bg-bg-elevated border rounded px-3 py-2.5 text-text-primary font-mono text-sm focus:border-accent-green focus:outline-none transition-colors placeholder:text-text-muted ${
      highlight ? 'border-accent-red' : 'border-border-dim'
    }`;

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-bg-surface border border-border-dim rounded-lg p-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-2">
            <Image src="/logo footer.svg" width={144} height={144} alt="ResumeMatch" />
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-text-primary font-sans">Create account</h1>
          <p className="mt-1 text-sm text-text-secondary">Start matching your resume today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider font-mono text-text-secondary mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Jane Doe"
              className={inputClass(fieldError === 'all')}
            />
          </div>

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
              className={inputClass(fieldError === 'all')}
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
              className={inputClass(fieldError === 'all')}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-mono text-text-secondary mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className={inputClass(fieldError === 'confirm' || fieldError === 'all')}
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-accent-green hover:underline font-mono">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
