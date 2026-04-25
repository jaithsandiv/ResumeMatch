'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import api from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';
import { AdminGuard } from '@/components/AdminGuard';
import { SkillsTagInput } from '@/components/SkillsTagInput';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';
import type { Job } from '@/components/JobCard';

type Tab = 'edit' | 'applicants';

const inputClass =
  'w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-border-bright transition-colors';

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('edit');
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'archived' | 'draft'>('active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/jobs/')
      .then(({ data }) => {
        const found: Job | undefined = (data.jobs ?? []).find((j: Job) => j._id === id);
        setJob(found ?? null);
        if (found) {
          setTitle(found.title);
          setCompany(found.company);
          setLocation(found.location ?? '');
          setSalaryRange(found.salary_range ?? '');
          setDescription(found.description ?? '');
          setSkills(found.required_skills ?? []);
          setStatus((found.status as 'active' | 'archived' | 'draft') ?? 'active');
        }
      })
      .catch((err) => {
        setJob(null);
        handleApiError(err, toast);
      })
      .finally(() => setLoading(false));
  }, [id, toast]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.put(`/jobs/${id}`, {
        title,
        company,
        location,
        salary_range: salaryRange,
        description,
        required_skills: skills,
        status,
      });
      toast.success('Job updated successfully');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      setError(detail ?? 'Failed to update job');
      handleApiError(err, toast, { fallback: 'Failed to update job' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-bg-base">
        <Navbar />

        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-text-secondary text-sm hover:text-text-primary transition-colors mb-4"
            >
              <ChevronLeft size={16} />
              Back to Admin
            </Link>

            {loading ? (
              <div className="h-8 w-48 bg-bg-elevated rounded animate-pulse" />
            ) : job ? (
              <>
                <h1 className="text-text-primary font-bold text-2xl">{job.title}</h1>
                <p className="text-text-secondary text-sm mt-1">{job.company}</p>
              </>
            ) : (
              <div className="flex flex-col gap-3 py-12 text-center text-text-muted">
                <p>Job not found.</p>
                <Link href="/admin" className="text-accent-blue text-sm hover:underline">
                  ← Back to Admin
                </Link>
              </div>
            )}
          </div>

          {!loading && job && (
            <>
              {/* Tabs */}
              <div className="border-b border-border-dim mb-8">
                <div className="flex gap-6">
                  {(
                    [
                      { key: 'edit', label: 'Edit Job' },
                      { key: 'applicants', label: 'Applicants' },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={
                        tab === key
                          ? 'pb-3 -mb-px border-b-2 border-accent-green text-text-primary text-sm font-medium'
                          : 'pb-3 -mb-px text-text-secondary hover:text-text-primary text-sm font-medium transition-colors'
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {tab === 'edit' ? (
                <form
                  onSubmit={handleSubmit}
                  className="bg-bg-surface border border-border-dim rounded-xl p-8 space-y-6"
                >
                  <div>
                    <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                      Job Title <span className="text-accent-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                      Company <span className="text-accent-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      placeholder="e.g. 80k-120k"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`${inputClass} min-h-32 resize-y`}
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                      Required Skills
                    </label>
                    <SkillsTagInput skills={skills} onChange={setSkills} />
                    <p className="text-text-muted text-xs mt-1.5">
                      Press Enter or comma to add a skill
                    </p>
                  </div>

                  <div>
                    <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-3">
                      Status
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {(['active', 'archived', 'draft'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`px-5 py-2 rounded-lg border font-mono text-sm transition-colors capitalize ${
                            status === s
                              ? 'bg-accent-green text-bg-base border-accent-green font-semibold'
                              : 'bg-bg-elevated border-border-dim text-text-muted hover:border-border-bright'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-accent-red text-sm">{error}</p>}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-accent-green text-bg-base font-semibold px-6 py-2.5 rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="border border-border-dim rounded-xl py-16 text-center">
                  <p className="text-text-muted font-medium">Applicant tracking coming soon</p>
                  <p className="text-text-muted text-sm mt-2">
                    Run /ai/graph-match to compute scores for individual applicants
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
