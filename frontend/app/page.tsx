'use client';

import { useState, useEffect } from 'react';
import { Search, Briefcase, Sparkles, X } from 'lucide-react';
import api from '@/lib/api';
import { JobCard, type Job } from '@/components/JobCard';
import { SkeletonJobCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';

const GRID_BG = `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0v40M40 0v40' stroke='%23252A3A' stroke-width='0.5' stroke-opacity='0.4'/%3E%3Cpath d='M0 0h40M0 40h40' stroke='%23252A3A' stroke-width='0.5' stroke-opacity='0.4'/%3E%3C/svg%3E")`;

export default function HomePage() {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .get('/jobs/')
      .then(({ data }) => setJobs(data.jobs ?? []))
      .catch((err) => handleApiError(err, toast))
      .finally(() => setLoading(false));
  }, [toast]);

  const activeCount = jobs.filter((j) => j.status === 'active').length;

  const filtered = jobs.filter((j) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.required_skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section
        className="relative bg-radial-hero overflow-hidden"
        style={{ backgroundImage: GRID_BG }}
      >
        {/* Subtle ambient overlays */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0, 229, 160, 0.08), transparent 70%)',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-1.5 mb-5 px-3 py-1 rounded-full border border-accent-green/30 bg-accent-green/5 text-accent-green text-xs font-mono">
            <Sparkles size={11} />
            AI-Powered Skill Matching
          </div>
          <h1 className="font-sans font-bold text-4xl sm:text-5xl text-text-primary mb-4 tracking-tight">
            Find your{' '}
            <span className="text-gradient-green">perfect match</span>
          </h1>
          <p className="text-text-secondary text-base max-w-xl mx-auto mb-8 leading-relaxed">
            AI-powered skill gap analysis with explainable scoring, know exactly
            where you stand and how to grow.
          </p>
          <div className="relative max-w-xl mx-auto group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4 pointer-events-none group-focus-within:text-accent-green transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs by title, skill, or company…"
              className="w-full bg-bg-elevated/80 backdrop-blur-sm border border-border-dim rounded-xl pl-11 pr-10 py-3.5 text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-accent-green/60 focus:bg-bg-elevated transition-all shadow-soft"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-bg-base transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar — floats over hero/main boundary */}
      <div className="max-w-4xl mx-auto px-6 -mt-9 relative z-10 mb-12">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Active Jobs', value: loading ? '—' : String(activeCount), color: 'text-accent-green' },
            { label: 'Skills Tracked', value: '500+', color: 'text-accent-blue' },
            { label: 'Matches Made', value: '2.4k+', color: 'text-accent-amber' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-bg-surface/95 backdrop-blur-sm border border-border-dim rounded-xl px-4 sm:px-6 py-3.5 text-center shadow-soft hover:border-border-bright transition-colors"
            >
              <div className={`font-mono ${color} text-lg sm:text-xl font-semibold`}>{value}</div>
              <div className="text-text-secondary text-xs mt-0.5 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section header */}
      <div className="max-w-7xl mx-auto px-6 mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-text-primary font-semibold text-xl">
            {query ? 'Search results' : 'Open positions'}
          </h2>
          {!loading && (
            <p className="text-text-muted text-sm font-mono mt-1">
              {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'}
              {query && ' matching your search'}
            </p>
          )}
        </div>
      </div>

      {/* Job grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonJobCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={query ? 'No matches found' : 'No active jobs found'}
            subtitle={query ? 'Try a different search term' : 'Check back soon for new opportunities'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
