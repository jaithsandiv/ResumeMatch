'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Users, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { AdminGuard } from '@/components/AdminGuard';
import { SkillsTagInput } from '@/components/SkillsTagInput';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';
import type { Job } from '@/components/JobCard';

const inputClass =
  'w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-border-bright transition-colors';

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

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
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtractSkills() {
    if (!description.trim()) {
      toast.error('Add a job description before extracting skills');
      return;
    }
    setExtracting(true);
    try {
      const { data } = await api.post('/ai/extract-skills-from-text', {
        text: description,
      });
      const extracted: string[] = Array.isArray(data?.skills) ? data.skills : [];
      const existing = new Set(skills.map((s) => s.toLowerCase()));
      const additions = extracted.filter((s) => !existing.has(s.toLowerCase()));
      if (additions.length > 0) {
        setSkills([...skills, ...additions]);
        toast.success(`Added ${additions.length} skill${additions.length === 1 ? '' : 's'}`);
      } else {
        toast.info('No new skills found in description');
      }
    } catch (err: unknown) {
      handleApiError(err, toast, { fallback: 'Failed to extract skills' });
    } finally {
      setExtracting(false);
    }
  }

  useEffect(() => {
    api
      .get(`/jobs/admin/${id}`)
      .then(({ data }) => {
        const found: Job | null = data.job ?? null;
        setJob(found);
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-text-primary font-bold text-2xl">{job.title}</h1>
                  <p className="text-text-secondary text-sm mt-1">{job.company}</p>
                </div>
                <Link
                  href={`/admin/jobs/${id}/applicants`}
                  className="inline-flex items-center gap-1.5 text-sm text-text-secondary border border-border-dim rounded-lg px-3 py-2 hover:border-border-bright hover:text-text-primary transition-colors shrink-0"
                >
                  <Users size={14} />
                  View Applicants
                </Link>
              </div>
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
                <div className="flex items-center justify-between mb-2 gap-2">
                  <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider">
                    Required Skills
                  </label>
                  <button
                    type="button"
                    onClick={handleExtractSkills}
                    disabled={extracting || !description.trim()}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-accent-blue border border-accent-blue/30 bg-accent-blue/10 rounded-lg px-2.5 py-1 hover:bg-accent-blue/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={12} />
                    {extracting ? 'Extracting…' : 'Extract from Description'}
                  </button>
                </div>
                <SkillsTagInput skills={skills} onChange={setSkills} />
                <p className="text-text-muted text-xs mt-1.5">
                  Press Enter or comma to add a skill, or extract them from the description
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
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
