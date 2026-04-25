'use client';

import { useState, useEffect } from 'react';
import { getUser } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';
import { ResumePanel } from '@/components/ResumePanel';
import { ApplicationsPanel } from '@/components/ApplicationsPanel';
import { SkeletonProfileStat } from '@/components/ui/Skeleton';

interface StoredResume {
  resume_id: string;
  filename: string;
  parse_status: string;
  uploaded_at: string;
}

interface StoredApplication {
  application_id: string;
  job_id: string;
  job_title: string;
  company: string;
  resume_id: string;
  status: string;
  applied_at: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Tab = 'resumes' | 'applications';

export default function ProfilePage() {
  const [user] = useState(() => getUser());
  const [tab, setTab] = useState<Tab>('resumes');
  const [resumeCount, setResumeCount] = useState(0);
  const [appCount, setAppCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    try {
      const resumes: StoredResume[] = JSON.parse(localStorage.getItem('rm_resumes') ?? '[]');
      const apps: StoredApplication[] = JSON.parse(localStorage.getItem('rm_applications') ?? '[]');
      setResumeCount(resumes.length);
      setAppCount(apps.length);
    } catch {
      // ignore parse errors
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const initials = user ? getInitials(user.full_name || user.email) : '?';

  return (
    <div className="min-h-screen bg-bg-base">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* User card */}
        <div className="bg-bg-surface border border-border-dim rounded-xl p-6 flex items-center gap-5 mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgb(79 142 247 / 0.2)', border: '1px solid rgb(79 142 247 / 0.3)' }}
          >
            <span className="text-accent-blue font-mono font-bold text-lg">{initials}</span>
          </div>
          <div className="min-w-0">
            <div className="text-text-primary font-semibold text-base truncate">
              {user?.full_name || '—'}
            </div>
            <div className="text-text-secondary text-sm truncate">{user?.email}</div>
            <span className="mt-1 inline-block text-text-muted font-mono text-xs border border-border-dim rounded px-2 py-0.5 capitalize">
              {user?.role ?? 'user'}
            </span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statsLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonProfileStat key={i} />)
            : [
                { label: 'Resumes Uploaded', value: resumeCount },
                { label: 'Applications Sent', value: appCount },
                { label: 'Avg Match Score', value: '—' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-bg-surface border border-border-dim rounded-lg p-4 text-center"
                >
                  <div className="font-mono text-accent-green text-2xl font-semibold">
                    {value}
                  </div>
                  <div className="text-text-muted text-xs mt-1">{label}</div>
                </div>
              ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-border-dim mb-6">
          <div className="flex gap-6">
            {(['resumes', 'applications'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  tab === t
                    ? 'pb-3 -mb-px border-b-2 border-accent-green text-text-primary text-sm font-medium capitalize'
                    : 'pb-3 -mb-px text-text-secondary hover:text-text-primary text-sm font-medium capitalize transition-colors'
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === 'resumes' ? (
          <ResumePanel onResumeCountChange={setResumeCount} />
        ) : (
          <ApplicationsPanel />
        )}
      </div>
    </div>
  );
}
