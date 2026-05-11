'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Users,
  Pencil,
  Download,
  ArrowRight,
} from 'lucide-react';
import api from '@/lib/api';
import { AdminGuard } from '@/components/AdminGuard';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Job } from '@/components/JobCard';

interface Applicant {
  application_id: string;
  candidate_email: string;
  resume_id: string;
  status: string;
  applied_at: string;
  match_score: number | null;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-bg-elevated border border-border-dim text-text-muted">
        Pending
      </span>
    );
  }
  const color =
    score >= 70
      ? 'bg-accent-green/10 border-accent-green/30 text-accent-green'
      : score >= 40
      ? 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber'
      : 'bg-accent-red/10 border-accent-red/30 text-accent-red';
  return (
    <span className={`font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full border ${color}`}>
      {score.toFixed(1)}%
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber',
    interview: 'bg-accent-green/10 border-accent-green/30 text-accent-green',
    rejected: 'bg-accent-red/10 border-accent-red/30 text-accent-red',
  };
  const cls = styles[status] ?? 'bg-bg-elevated border-border-dim text-text-muted';
  return (
    <span className={`font-mono text-xs px-2.5 py-0.5 rounded-full border capitalize ${cls}`}>
      {status}
    </span>
  );
}

export default function JobApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(true);

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/jobs/admin/${id}`)
      .then(({ data }) => setJob(data.job ?? null))
      .catch(() => setJob(null))
      .finally(() => setJobLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/applications/job/${id}`)
      .then(({ data }) => setApplicants(data.applicants ?? []))
      .catch((err) => handleApiError(err, toast))
      .finally(() => setLoading(false));
  }, [id, toast]);

  async function handleDownloadResume(resumeId: string) {
    setDownloadingId(resumeId);
    try {
      const { data } = await api.get(`/resumes/${resumeId}/download-url`);
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      handleApiError(err, toast, { fallback: 'Download failed' });
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleStatusUpdate(applicationId: string, newStatus: string) {
    setActionLoading((prev) => ({ ...prev, [applicationId]: true }));
    try {
      await api.patch(`/applications/${applicationId}/status`, { status: newStatus });
      setApplicants((prev) =>
        prev.map((a) =>
          a.application_id === applicationId ? { ...a, status: newStatus } : a
        )
      );
      toast.success(`Applicant marked as ${newStatus}`);
    } catch (err) {
      handleApiError(err, toast, { fallback: 'Failed to update status' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [applicationId]: false }));
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-text-secondary text-sm hover:text-text-primary transition-colors mb-4"
            >
              <ChevronLeft size={16} />
              Back to Admin
            </Link>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center shrink-0">
                  <Users size={18} className="text-accent-blue" />
                </div>
                <div className="min-w-0">
                  {jobLoading ? (
                    <div className="space-y-2">
                      <div className="h-7 w-56 bg-bg-elevated rounded animate-pulse" />
                      <div className="h-4 w-32 bg-bg-elevated rounded animate-pulse" />
                    </div>
                  ) : job ? (
                    <>
                      <h1 className="text-text-primary font-bold text-2xl tracking-tight truncate">
                        {job.title}
                      </h1>
                      <p className="text-text-secondary text-sm mt-0.5">{job.company}</p>
                    </>
                  ) : (
                    <p className="text-text-muted">Job not found.</p>
                  )}
                </div>
              </div>
              {job && (
                <Link
                  href={`/admin/jobs/${id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-text-secondary border border-border-dim rounded-lg px-3 py-2 hover:border-accent-amber/30 hover:text-accent-amber transition-all shrink-0"
                >
                  <Pencil size={14} />
                  Edit Job
                </Link>
              )}
            </div>
          </div>

          {/* Applicants table */}
          <div className="bg-bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-soft">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-dim">
              <h2 className="text-text-primary font-semibold text-base">
                Applicant Rankings
              </h2>
              {!loading && (
                <span className="font-mono text-xs text-text-muted">
                  {applicants.length} {applicants.length === 1 ? 'applicant' : 'applicants'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : applicants.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No applicants yet"
                subtitle="Applicants will appear here once candidates apply"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-elevated/50">
                    <tr className="border-b border-border-dim">
                      {['Rank', 'Candidate', 'Match Score', 'Status', 'Applied', 'Insights', 'Resume', 'Actions'].map(
                        (col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left text-text-muted font-mono text-xs uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((applicant, idx) => (
                      <tr
                        key={applicant.application_id}
                        className="border-b border-border-dim last:border-0 hover:bg-bg-elevated/40 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-bg-elevated border border-border-dim text-text-muted font-mono text-xs font-semibold">
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-text-primary">
                          {applicant.candidate_email}
                        </td>
                        <td className="px-4 py-3.5">
                          <ScoreBadge score={applicant.match_score} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={applicant.status} />
                        </td>
                        <td className="px-4 py-3.5 text-text-muted font-mono text-xs whitespace-nowrap">
                          {formatDate(applicant.applied_at)}
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/insights/${applicant.application_id}?job_id=${id}&resume_id=${applicant.resume_id}`}
                            className="inline-flex items-center gap-1 text-accent-blue text-xs hover:underline whitespace-nowrap"
                          >
                            View Insights
                            <ArrowRight size={11} />
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => handleDownloadResume(applicant.resume_id)}
                            disabled={downloadingId === applicant.resume_id}
                            title="Download Resume"
                            className="inline-flex items-center gap-1 text-accent-blue/90 border border-accent-blue/30 hover:bg-accent-blue/10 hover:border-accent-blue/60 hover:text-accent-blue transition-colors text-xs px-2.5 py-1 rounded-md disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  applicant.application_id,
                                  applicant.status === 'interview' ? 'pending' : 'interview'
                                )
                              }
                              disabled={actionLoading[applicant.application_id]}
                              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                applicant.status === 'interview'
                                  ? 'bg-accent-green/25 border-accent-green/60 text-accent-green'
                                  : 'bg-accent-green/10 border-accent-green/30 text-accent-green hover:bg-accent-green/20 hover:border-accent-green/60'
                              }`}
                            >
                              Interview
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  applicant.application_id,
                                  applicant.status === 'rejected' ? 'pending' : 'rejected'
                                )
                              }
                              disabled={actionLoading[applicant.application_id]}
                              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                applicant.status === 'rejected'
                                  ? 'bg-accent-red/25 border-accent-red/60 text-accent-red'
                                  : 'bg-accent-red/10 border-accent-red/30 text-accent-red hover:bg-accent-red/20 hover:border-accent-red/60'
                              }`}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
