'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
  Users,
  MapPin,
  Briefcase,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import { SkillTag } from '@/components/ui/SkillTag';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';
import type { Job } from '@/components/JobCard';

interface Resume {
  resume_id: string;
  filename: string;
}

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diff === 0) return 'today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [appliedAppId, setAppliedAppId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoggedIn(getUser() !== null);
  }, []);

  useEffect(() => {
    api
      .get('/jobs/')
      .then(({ data }) => {
        const found = (data.jobs ?? []).find((j: Job) => j._id === id) ?? null;
        setJob(found);
      })
      .catch((err) => {
        setJob(null);
        handleApiError(err, toast);
      })
      .finally(() => setLoading(false));
  }, [id, toast]);

  useEffect(() => {
    if (!descRef.current) return;
    setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight);
  }, [job]);

  useEffect(() => {
    if (!open) return;
    api
      .get('/resumes/')
      .then(({ data }) => {
        setResumes(
          (data.resumes ?? []).map(
            (r: { _id: string; original_filename: string }) => ({
              resume_id: r._id,
              filename: r.original_filename,
            })
          )
        );
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem('rm_resumes');
          setResumes(stored ? (JSON.parse(stored) as Resume[]) : []);
        } catch {
          setResumes([]);
        }
      });
  }, [open]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setAppliedAppId(null);
      setApplyError(null);
    }
  }

  async function handleApply() {
    if (!selectedResume || !job) return;
    setApplying(true);
    setApplyError(null);
    try {
      const { data } = await api.post('/applications/apply', {
        job_id: job._id,
        resume_id: selectedResume,
        cover_letter: coverLetter,
      });
      const newAppId = data.application_id ?? data._id ?? data.id ?? '';
      setAppliedAppId(newAppId);

      try {
        const stored = JSON.parse(localStorage.getItem('rm_applications') ?? '[]');
        const entry = {
          application_id: newAppId,
          job_id: job._id,
          job_title: job.title,
          company: job.company,
          resume_id: selectedResume,
          status: 'pending',
          applied_at: new Date().toISOString(),
        };
        localStorage.setItem(
          'rm_applications',
          JSON.stringify([entry, ...stored])
        );
      } catch {
        // ignore storage errors
      }

      toast.success('Application submitted');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setApplyError(detail ?? 'Failed to apply. Please try again.');
      handleApiError(err, toast, { fallback: 'Failed to apply' });
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex items-center gap-2.5">
          <Loader2 className="w-4 h-4 animate-spin text-accent-green" />
          <span className="text-text-muted font-mono text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-text-secondary">Job not found.</p>
        <Link href="/" className="inline-flex items-center gap-1 text-accent-blue text-sm hover:underline">
          <ChevronLeft size={14} />
          All Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-text-secondary text-sm hover:text-text-primary transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          All Jobs
        </Link>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* ── Left column ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-text-primary font-bold text-3xl tracking-tight">{job.title}</h1>
              {job.status === 'active' && (
                <span className="shrink-0 inline-flex items-center gap-1 bg-accent-green/10 border border-accent-green/30 text-accent-green text-xs font-mono px-2.5 py-1 rounded-full mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                  Active
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-6">
              <span className="inline-flex items-center gap-1.5 text-text-primary font-medium">
                <Briefcase size={14} className="text-text-muted" />
                {job.company}
              </span>
              {job.location && (
                <span className="inline-flex items-center gap-1.5 text-text-secondary">
                  <MapPin size={14} className="text-text-muted" />
                  {job.location}
                </span>
              )}
            </div>

            <div className="mb-8 flex flex-wrap gap-2">
              <span
                title="Total applicants for this role"
                className="inline-flex items-center gap-1.5 bg-bg-surface border border-border-dim text-text-secondary text-xs font-mono px-2.5 py-1 rounded-full"
              >
                <Users className="w-3.5 h-3.5 text-accent-blue" />
                {job.applicant_count ?? 0}{' '}
                {(job.applicant_count ?? 0) === 1 ? 'applicant' : 'applicants'}
              </span>
            </div>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-text-primary font-semibold text-base">Required Skills</h2>
                <span className="bg-bg-elevated border border-border-dim text-text-muted text-xs font-mono px-2 py-0.5 rounded-full">
                  {job.required_skills.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill) => (
                  <SkillTag key={skill} label={skill} variant="neutral" />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-text-primary font-semibold text-base mb-4">About the Role</h2>
              <div className="relative">
                <p
                  ref={descRef}
                  style={
                    descExpanded
                      ? undefined
                      : { display: '-webkit-box', WebkitLineClamp: 20, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
                  }
                  className="text-text-secondary text-sm leading-relaxed whitespace-pre-line"
                >
                  {job.description}
                </p>
                {!descExpanded && descOverflows && (
                  <div className="absolute bottom-0 inset-x-0 h-16 bg-linear-to-t from-bg-base to-transparent pointer-events-none" />
                )}
              </div>
              {descOverflows && (
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-3 inline-flex items-center gap-1 text-accent-blue text-sm hover:underline"
                >
                  {descExpanded ? (
                    <><ChevronUp size={14} /> Show less</>
                  ) : (
                    <><ChevronDown size={14} /> Show more</>
                  )}
                </button>
              )}
            </section>
          </div>

          {/* ── Right sidebar ── */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-24 bg-bg-surface border border-border-dim rounded-2xl p-6 shadow-soft">
              <div className="mb-6">
                <div className="text-text-muted text-xs font-mono uppercase tracking-wider mb-1">
                  Salary Range
                </div>
                <div className="font-mono text-accent-green text-2xl font-bold">
                  {job.salary_range || '—'}
                </div>
                <div className="text-text-muted text-xs mt-2 font-mono">
                  Posted {daysAgo(job.created_at)}
                </div>
              </div>

              {isLoggedIn ? (
                <Dialog.Root open={open} onOpenChange={handleOpenChange}>
                  <Dialog.Trigger asChild>
                    <button className="w-full bg-accent-green text-bg-base font-semibold py-3 rounded-lg text-sm hover:brightness-110 transition-all shadow-glow-green/0 hover:shadow-glow-green inline-flex items-center justify-center gap-1.5">
                      Apply Now
                      <ArrowRight size={15} />
                    </button>
                  </Dialog.Trigger>

                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-bg-surface border border-border-dim rounded-2xl p-6 shadow-elevated focus:outline-none animate-fade-in-up">
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div className="min-w-0">
                          <Dialog.Title className="text-text-primary font-semibold text-base">
                            Apply to this role
                          </Dialog.Title>
                          <p className="text-text-secondary text-sm mt-0.5 truncate">{job.title}</p>
                        </div>
                        <Dialog.Close asChild>
                          <button className="text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-bg-elevated">
                            <X className="w-4 h-4" />
                          </button>
                        </Dialog.Close>
                      </div>

                      {appliedAppId ? (
                        <div className="text-center py-6 space-y-4">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-green/15 border border-accent-green/30">
                            <CheckCircle2 size={26} className="text-accent-green" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-text-primary font-semibold">Application submitted</p>
                            <p className="text-text-secondary text-sm">You&apos;re all set. View your insights below.</p>
                          </div>
                          <Link
                            href={`/insights/${appliedAppId}?job_id=${job._id}&resume_id=${selectedResume}`}
                            className="inline-flex items-center gap-1.5 bg-accent-green text-bg-base font-semibold px-4 py-2 rounded-lg text-sm hover:brightness-110 transition-all"
                          >
                            View Insights
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                              Select your resume
                            </label>
                            <select
                              value={selectedResume}
                              onChange={(e) => setSelectedResume(e.target.value)}
                              className="w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2.5 text-text-primary text-sm outline-none focus:border-accent-green/60 transition-colors"
                            >
                              <option value="">— Choose a resume —</option>
                              {resumes.map((r) => (
                                <option key={r.resume_id} value={r.resume_id}>
                                  {r.filename}
                                </option>
                              ))}
                            </select>
                            {resumes.length === 0 && (
                              <p className="text-text-muted text-xs mt-2">
                                No resumes found.{' '}
                                <Link href="/profile" className="text-accent-blue hover:underline">
                                  Upload one in your profile
                                </Link>
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                              Cover letter <span className="normal-case text-text-muted">(optional)</span>
                            </label>
                            <textarea
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                              rows={4}
                              placeholder="Write a brief cover letter…"
                              className="w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-accent-green/60 transition-colors resize-none"
                            />
                          </div>

                          {applyError && (
                            <div className="rounded-lg border border-accent-red/30 bg-accent-red/5 px-3 py-2">
                              <p className="text-accent-red text-xs">{applyError}</p>
                            </div>
                          )}

                          <button
                            onClick={handleApply}
                            disabled={!selectedResume || applying}
                            className="w-full inline-flex items-center justify-center gap-2 bg-accent-green text-bg-base font-semibold py-2.5 rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {applying ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Submitting…
                              </>
                            ) : (
                              'Submit Application'
                            )}
                          </button>
                        </div>
                      )}
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              ) : (
                <Link
                  href="/auth/login"
                  className="block w-full text-center bg-bg-elevated border border-border-dim text-text-secondary py-3 rounded-lg text-sm hover:border-accent-green/40 hover:text-accent-green transition-all"
                >
                  Sign in to apply
                </Link>
              )}

              <div className="mt-4 pt-4 border-t border-border-dim space-y-2 text-xs">
                <div className="flex items-center justify-between text-text-muted">
                  <span>Status</span>
                  <span className="text-text-secondary font-mono capitalize">{job.status}</span>
                </div>
                <div className="flex items-center justify-between text-text-muted">
                  <span>Skills required</span>
                  <span className="text-text-secondary font-mono">{job.required_skills.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
