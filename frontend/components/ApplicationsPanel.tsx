'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import Link from 'next/link';
import { SendHorizontal } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonJobCard } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import { handleApiError } from '@/lib/apiError';
import { useToast } from '@/hooks/useToast';

interface StoredApplication {
  application_id: string;
  job_id: string;
  job_title: string;
  company: string;
  resume_id: string;
  status: 'pending' | 'interview' | 'rejected' | 'accepted';
  applied_at: string;
}

const accentStrip: Record<StoredApplication['status'], string> = {
  pending: 'bg-accent-amber',
  interview: 'bg-accent-blue',
  rejected: 'bg-[#F06060]',
  accepted: 'bg-accent-green',
};

const statusBadgeStyle: Record<StoredApplication['status'], CSSProperties> = {
  pending: {
    backgroundColor: 'rgb(245 166 35 / 0.1)',
    color: '#F5A623',
    border: '1px solid rgb(245 166 35 / 0.3)',
  },
  interview: {
    backgroundColor: 'rgb(79 142 247 / 0.1)',
    color: '#4F8EF7',
    border: '1px solid rgb(79 142 247 / 0.3)',
  },
  rejected: {
    backgroundColor: 'rgb(240 96 96 / 0.1)',
    color: '#F06060',
    border: '1px solid rgb(240 96 96 / 0.3)',
  },
  accepted: {
    backgroundColor: 'rgb(0 229 160 / 0.1)',
    color: '#00E5A0',
    border: '1px solid rgb(0 229 160 / 0.3)',
  },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function ApplicationsPanel() {
  const toast = useToast();
  const [applications, setApplications] = useState<StoredApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ applications: StoredApplication[] }>('/applications/user')
      .then(({ data }) => setApplications(data.applications ?? []))
      .catch((err) => handleApiError(err, toast))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonJobCard key={i} />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={SendHorizontal}
        title="No applications yet"
        subtitle={
          <Link href="/" className="text-accent-blue hover:underline">
            Browse Jobs →
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const strip = accentStrip[app.status] ?? 'bg-border-dim';
        const badge = statusBadgeStyle[app.status];

        return (
          <div
            key={app.application_id}
            className="bg-bg-surface border border-border-dim rounded-lg flex overflow-hidden"
          >
            {/* Status accent strip */}
            <div className={`w-1 shrink-0 ${strip}`} />

            {/* Body */}
            <div className="flex-1 px-5 py-4 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-text-primary font-semibold text-sm truncate">
                    {app.job_title}
                  </div>
                  <div className="text-text-secondary text-sm">{app.company}</div>
                </div>
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded-full shrink-0 capitalize"
                  style={badge}
                >
                  {app.status}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-text-muted">
                  Applied {formatDate(app.applied_at)}
                </span>
                <Link
                  href={`/insights/${app.application_id}?job_id=${app.job_id}&resume_id=${app.resume_id}`}
                  className="text-accent-blue text-sm hover:underline shrink-0"
                >
                  View Insights →
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
