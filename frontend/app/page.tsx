'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '@/lib/api';
import { JobCard, type Job } from '@/components/JobCard';

const GRID_BG = `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0v40M40 0v40' stroke='%23252A3A' stroke-width='0.5' stroke-opacity='0.5'/%3E%3Cpath d='M0 0h40M0 40h40' stroke='%23252A3A' stroke-width='0.5' stroke-opacity='0.5'/%3E%3C/svg%3E")`;

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .get('/jobs/')
      .then(({ data }) => setJobs(data.jobs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
    <main className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section
        className="bg-bg-surface relative"
        style={{ backgroundImage: GRID_BG }}
      >
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="font-sans font-bold text-3xl text-text-primary mb-3">
            Find your perfect match
          </h1>
          <p className="text-text-secondary mb-8">
            AI-powered skill gap analysis for every application
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs by title, skill, or company…"
              className="w-full bg-bg-elevated border border-border-dim rounded-lg pl-11 pr-4 py-3 text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-border-bright transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="max-w-4xl mx-auto px-6 -mt-5 relative z-10 mb-12">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active Jobs', value: loading ? '—' : String(activeCount) },
            { label: 'Skills Tracked', value: '500+' },
            { label: 'Matches Made', value: '2.4k+' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-bg-surface border border-border-dim rounded px-6 py-3 text-center"
            >
              <div className="font-mono text-accent-green text-lg font-semibold">{value}</div>
              <div className="text-text-secondary text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Job grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-bg-elevated rounded-lg p-5 animate-pulse h-44" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-muted">
            <Search className="w-10 h-10" />
            <p className="text-base">No jobs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
