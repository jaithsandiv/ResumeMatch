'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    api
      .get('/auth/admin/me')
      .then(() => setVerified(true))
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) {
          toast.error('Access denied');
          router.push('/profile');
        }
      });
  }, [router, toast]);

  if (!verified) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-accent-green" />
        <p className="text-text-muted font-mono text-xs">Verifying access…</p>
      </div>
    );
  }

  return <>{children}</>;
}
