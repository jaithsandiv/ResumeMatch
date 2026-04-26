'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronDown, ChevronUp, X, Users } from 'lucide-react';
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
        <span className="text-text-muted font-mono text-sm animate-pulse">Loading…</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">Job not found.</p>
        <Link href="/" className="text-accent-blue text-sm hover:underline">
          ← All Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-accent-blue text-sm hover:underline mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          All Jobs
        </Link>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* ── Left column ── */}
          <div className="flex-1 min-w-0">
            <h1 className="text-text-primary font-bold text-2xl mb-2">{job.title}</h1>
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-4">
              <span>{job.company}</span>
              <span className="text-text-muted">·</span>
              <span className="font-mono text-text-muted text-xs">{job.location}</span>
            </div>
            <div className="mb-8">
              <span
                title="Total applicants for this role"
                className="inline-flex items-center gap-1.5 bg-bg-elevated border border-border-dim text-text-secondary text-xs font-mono px-2.5 py-1 rounded-full"
              >
                <Users className="w-3.5 h-3.5 text-accent-blue" />
                {job.applicant_count ?? 0}{' '}
                {(job.applicant_count ?? 0) === 1 ? 'applicant' : 'applicants'}
              </span>
            </div>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
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
              <h2 className="text-text-primary font-semibold text-base mb-3">About the Role</h2>
              <div className="relative">
                <p
                  ref={descRef}
                  style={descExpanded ? undefined : { display: '-webkit-box', WebkitLineClamp: 20, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  className="text-text-secondary text-sm leading-relaxed whitespace-pre-line"
                >
                  {job.description}
                </p>
                {!descExpanded && descOverflows && (
                  <div className="absolute bottom-0 inset-x-0 h-12 bg-linear-to-t from-bg-base to-transparent pointer-events-none" />
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
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-24 bg-bg-surface border border-border-dim rounded-lg p-6">
              <div className="mb-5">
                <div className="font-mono text-accent-green text-xl font-semibold">
                  {job.salary_range}
                </div>
                <div className="text-text-muted text-xs mt-1">
                  Posted {daysAgo(job.created_at)}
                </div>
              </div>

              {isLoggedIn ? (
                <Dialog.Root open={open} onOpenChange={handleOpenChange}>
                  <Dialog.Trigger asChild>
                    <button className="w-full bg-accent-green text-bg-base font-bold py-3 rounded text-sm hover:opacity-90 transition-opacity">
                      Apply Now
                    </button>
                  </Dialog.Trigger>

                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-bg-surface border border-border-dim rounded-xl p-6 shadow-xl focus:outline-none">
                      <div className="flex items-center justify-between mb-5">
                        <Dialog.Title className="text-text-primary font-semibold text-base">
                          Apply — {job.title}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                          <button className="text-text-muted hover:text-text-secondary transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </Dialog.Close>
                      </div>

                      {appliedAppId ? (
                        <div className="text-center py-6">
                          <p className="text-accent-green font-semibold mb-3">
                            Application submitted!
                          </p>
                          <Link
                            href={`/insights/${appliedAppId}?job_id=${job._id}&resume_id=${selectedResume}`}
                            className="text-accent-blue text-sm hover:underline"
                          >
                            View Insights →
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="text-text-secondary text-xs block mb-1.5">
                              Select your resume
                            </label>
                            <select
                              value={selectedResume}
                              onChange={(e) => setSelectedResume(e.target.value)}
                              className="w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2 text-text-primary text-sm outline-none focus:border-border-bright transition-colors"
                            >
                              <option value="">— Choose a resume —</option>
                              {resumes.map((r) => (
                                <option key={r.resume_id} value={r.resume_id}>
                                  {r.filename}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-text-secondary text-xs block mb-1.5">
                              Cover letter (optional)
                            </label>
                            <textarea
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                              rows={4}
                              placeholder="Write a brief cover letter…"
                              className="w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-border-bright transition-colors resize-none"
                            />
                          </div>

                          {applyError && (
                            <p className="text-accent-red text-xs">{applyError}</p>
                          )}

                          <button
                            onClick={handleApply}
                            disabled={!selectedResume || applying}
                            className="w-full bg-accent-green text-bg-base font-bold py-3 rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {applying ? 'Submitting…' : 'Submit Application'}
                          </button>
                        </div>
                      )}
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              ) : (
                <Link
                  href="/auth/login"
                  className="block w-full text-center bg-bg-elevated border border-border-dim text-text-secondary py-3 rounded text-sm hover:border-border-bright transition-colors"
                >
                  Sign in to apply
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
