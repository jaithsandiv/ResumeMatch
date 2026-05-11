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
  Clock,
  DollarSign,
  Sparkles,
  FileText,
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

function CompanyAvatar({ company }: { company: string }) {
  const initials = company
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-accent-blue/25 to-accent-purple/25 border border-border-bright flex items-center justify-center shrink-0 shadow-soft">
      <span className="text-text-primary font-bold text-lg font-mono">{initials}</span>
    </div>
  );
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
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-accent-green" />
          <span className="text-text-muted font-mono text-sm">Loading job…</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-12 h-12 rounded-2xl bg-bg-elevated border border-border-dim flex items-center justify-center mb-2">
          <Briefcase className="w-5 h-5 text-text-muted" />
        </div>
        <p className="text-text-secondary font-medium">Job not found.</p>
        <Link href="/" className="inline-flex items-center gap-1.5 text-accent-blue text-sm hover:underline">
          <ChevronLeft size={14} />
          Browse all jobs
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
          className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-primary transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          All Jobs
        </Link>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* ── Left column ── */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Header card */}
            <div className="relative bg-bg-surface border border-border-dim rounded-2xl overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent-blue/50 to-transparent" />
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <CompanyAvatar company={job.company} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h1 className="text-text-primary font-bold text-2xl sm:text-3xl tracking-tight leading-tight">
                        {job.title}
                      </h1>
                      {job.status === 'active' && (
                        <span className="shrink-0 inline-flex items-center gap-1.5 bg-accent-green/10 border border-accent-green/25 text-accent-green text-xs font-mono px-2.5 py-1 rounded-full mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-text-secondary font-medium text-base mb-4">{job.company}</p>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                      {job.location && (
                        <span className="inline-flex items-center gap-1.5 text-text-muted">
                          <MapPin size={13} />
                          {job.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-text-muted">
                        <Users size={13} />
                        {job.applicant_count ?? 0}{' '}
                        {(job.applicant_count ?? 0) === 1 ? 'applicant' : 'applicants'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-text-muted">
                        <Clock size={13} />
                        Posted {daysAgo(job.created_at)}
                      </span>
                      {/* {job.salary_range && (
                        <span className="inline-flex items-center gap-1.5 text-accent-green font-mono text-xs font-semibold">
                          <DollarSign size={13} />
                          {job.salary_range}
                        </span>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Required Skills */}
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-1 h-5 rounded-full bg-accent-blue" />
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

            <div className="border-t border-border-dim/60" />

            {/* About the Role */}
            <section>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-1 h-5 rounded-full bg-accent-purple" />
                <h2 className="text-text-primary font-semibold text-base">About the Role</h2>
              </div>
              <div className="relative bg-bg-surface/50 rounded-xl border border-border-dim/50 p-5 sm:p-6">
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
                  <div className="absolute bottom-0 inset-x-0 h-16 bg-linear-to-t from-bg-base to-transparent pointer-events-none rounded-b-xl" />
                )}
              </div>
              {descOverflows && (
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-3 inline-flex items-center gap-1.5 text-accent-blue text-sm hover:text-accent-blue/80 transition-colors"
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
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-24">
              <div className="relative bg-bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-soft">
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent-green/50 to-transparent" />
                <div className="p-6">
                  {/* Salary */}
                  {job.salary_range && (
                    <div className="mb-5 pb-5 border-b border-border-dim">
                      <p className="text-text-muted text-xs font-mono uppercase tracking-wider mb-1.5">Salary</p>
                      <p className="font-mono text-accent-green text-xl font-bold">{job.salary_range}</p>
                    </div>
                  )}

                  {/* Apply button */}
                  {isLoggedIn ? (
                    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
                      <Dialog.Trigger asChild>
                        <button className="w-full bg-accent-green text-bg-base font-bold py-3 rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_-4px_rgba(0,229,160,0.35)] hover:shadow-[0_0_28px_-4px_rgba(0,229,160,0.5)] inline-flex items-center justify-center gap-2">
                          Apply Now
                          <ArrowRight size={15} />
                        </button>
                      </Dialog.Trigger>

                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
                        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-bg-surface border border-border-dim rounded-2xl shadow-elevated focus:outline-none animate-fade-in-up overflow-hidden">
                          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent-green/50 to-transparent" />
                          <div className="p-6">
                            <div className="flex items-start justify-between gap-3 mb-6">
                              <div className="min-w-0">
                                <Dialog.Title className="text-text-primary font-bold text-lg">
                                  Apply to this role
                                </Dialog.Title>
                                <p className="text-text-muted text-sm mt-1 truncate">{job.title} · {job.company}</p>
                              </div>
                              <Dialog.Close asChild>
                                <button className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-bg-elevated shrink-0">
                                  <X className="w-4 h-4" />
                                </button>
                              </Dialog.Close>
                            </div>

                            {appliedAppId ? (
                              <div className="text-center py-8 space-y-5">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-green/10 border border-accent-green/25">
                                  <CheckCircle2 size={28} className="text-accent-green" />
                                </div>
                                <div className="space-y-1.5">
                                  <p className="text-text-primary font-bold text-lg">Application submitted!</p>
                                  <p className="text-text-secondary text-sm">You&apos;re all set. View your match insights below.</p>
                                </div>
                                <Link
                                  href={`/insights/${appliedAppId}?job_id=${job._id}&resume_id=${selectedResume}`}
                                  className="inline-flex items-center gap-2 bg-accent-green text-bg-base font-bold px-5 py-2.5 rounded-xl text-sm hover:brightness-110 transition-all"
                                >
                                  <Sparkles size={14} />
                                  View Insights
                                </Link>
                              </div>
                            ) : (
                              <div className="space-y-5">
                                <div>
                                  <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                                    Resume
                                  </label>
                                  <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                                    <select
                                      value={selectedResume}
                                      onChange={(e) => setSelectedResume(e.target.value)}
                                      className="w-full bg-bg-elevated border border-border-dim rounded-xl pl-9 pr-3 py-2.5 text-text-primary text-sm outline-none focus:border-accent-green/50 transition-colors appearance-none cursor-pointer"
                                    >
                                      <option value="">— Choose a resume —</option>
                                      {resumes.map((r) => (
                                        <option key={r.resume_id} value={r.resume_id}>
                                          {r.filename}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
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
                                    className="w-full bg-bg-elevated border border-border-dim rounded-xl px-3.5 py-3 text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-accent-green/50 transition-colors resize-none"
                                  />
                                </div>

                                {applyError && (
                                  <div className="rounded-xl border border-accent-red/25 bg-accent-red/5 px-4 py-3 flex gap-2.5 items-start">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-red shrink-0 mt-1.5" />
                                    <p className="text-accent-red text-xs leading-relaxed">{applyError}</p>
                                  </div>
                                )}

                                <button
                                  onClick={handleApply}
                                  disabled={!selectedResume || applying}
                                  className="w-full inline-flex items-center justify-center gap-2 bg-accent-green text-bg-base font-bold py-3 rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {applying ? (
                                    <>
                                      <Loader2 size={14} className="animate-spin" />
                                      Submitting…
                                    </>
                                  ) : (
                                    <>Submit Application <ArrowRight size={14} /></>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog.Root>
                  ) : (
                    <Link
                      href="/auth/login"
                      className="block w-full text-center bg-bg-elevated border border-border-bright text-text-secondary py-3 rounded-xl text-sm hover:border-accent-green/40 hover:text-accent-green transition-all font-medium"
                    >
                      Sign in to apply
                    </Link>
                  )}

                  {/* Job metadata */}
                  <div className="mt-5 pt-5 border-t border-border-dim space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Status</span>
                      <span className="font-mono font-medium capitalize text-text-secondary">{job.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Skills required</span>
                      <span className="font-mono font-medium text-text-secondary">{job.required_skills.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Applicants</span>
                      <span className="font-mono font-medium text-text-secondary">{job.applicant_count ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Posted</span>
                      <span className="font-mono font-medium text-text-secondary">{daysAgo(job.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
