'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import Link from 'next/link';

interface StoredApplication {
  application_id: string;
  job_id: string;
  job_title: string;
  company: string;
  resume_id: string;
  status: 'pending' | 'reviewed' | 'rejected' | 'accepted';
  applied_at: string;
}

const accentStrip: Record<StoredApplication['status'], string> = {
  pending: 'bg-accent-amber',
  reviewed: 'bg-accent-blue',
  rejected: 'bg-[#F06060]',
  accepted: 'bg-accent-green',
};

const statusBadgeStyle: Record<StoredApplication['status'], CSSProperties> = {
  pending: {
    backgroundColor: 'rgb(245 166 35 / 0.1)',
    color: '#F5A623',
    border: '1px solid rgb(245 166 35 / 0.3)',
  },
  reviewed: {
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
  const [applications, setApplications] = useState<StoredApplication[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem('rm_applications') ?? '[]'
      ) as StoredApplication[];
      setApplications(stored);
    } catch {
      setApplications([]);
    }
  }, []);

  if (applications.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted text-sm mb-3">No applications yet.</p>
        <Link href="/" className="text-accent-blue text-sm hover:underline">
          Browse Jobs →
        </Link>
      </div>
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
