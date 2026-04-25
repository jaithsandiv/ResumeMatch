'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';

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
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
