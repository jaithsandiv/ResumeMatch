'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { Pencil, Trash2, Plus, Briefcase } from 'lucide-react';
import api from '@/lib/api';
import { AdminGuard } from '@/components/AdminGuard';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Job } from '@/components/JobCard';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total_resumes: number; total_applications: number; total_users: number } | null>(null);

  useEffect(() => {
    api
      .get('/jobs/')
      .then(({ data }) => setJobs(data.jobs ?? []))
      .catch((err) => handleApiError(err, toast))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    api
      .get('/auth/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, []);

  const activeCount = jobs.filter((j) => j.status === 'active').length;

  async function handleToggleStatus(job: Job) {
    const newStatus = job.status === 'active' ? 'archived' : 'active';
    setTogglingId(job._id);
    try {
      await api.put(`/jobs/${job._id}`, { status: newStatus });
      setJobs((prev) =>
        prev.map((j) => (j._id === job._id ? { ...j, status: newStatus } : j))
      );
    } catch (err) {
      handleApiError(err, toast, { fallback: 'Failed to update status' });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!jobToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/jobs/${jobToDelete._id}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobToDelete._id));
      toast.success('Job deleted successfully');
      setJobToDelete(null);
    } catch (err) {
      handleApiError(err, toast, { fallback: 'Failed to delete job' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-bg-base">
        {/* Admin header */}
        <div className="bg-bg-surface border-b border-border-dim px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <h1 className="text-text-primary font-bold text-xl">Admin Panel</h1>
            <span className="bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-accent-green font-mono text-xs px-2.5 py-1 rounded-full">
              System Administrator
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Active Jobs', value: loading ? '—' : String(activeCount), href: null },
              { label: 'Total Resumes', value: stats ? String(stats.total_resumes) : '—', href: null },
              { label: 'Applications', value: stats ? String(stats.total_applications) : '—', href: null },
              { label: 'Users', value: stats ? String(stats.total_users) : '—', href: '/admin/users' },
            ].map(({ label, value, href }) => {
              const inner = (
                <>
                  <div className="font-mono text-accent-green text-3xl font-bold mb-1">{value}</div>
                  <div className="text-text-muted text-xs uppercase font-mono tracking-wider">{label}</div>
                </>
              );
              return href ? (
                <Link
                  key={label}
                  href={href}
                  className="bg-bg-elevated border border-border-dim rounded-lg px-6 py-5 hover:border-accent-green/40 transition-colors"
                >
                  {inner}
                </Link>
              ) : (
                <div key={label} className="bg-bg-elevated border border-border-dim rounded-lg px-6 py-5">
                  {inner}
                </div>
              );
            })}
          </div>

          {/* Jobs table */}
          <div className="bg-bg-surface border border-border-dim rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-dim">
              <h2 className="text-text-primary font-semibold text-base">Job Listings</h2>
              <Link
                href="/admin/jobs/new"
                className="inline-flex items-center gap-1.5 bg-accent-green text-bg-base font-semibold text-sm px-4 py-2 rounded-lg hover:brightness-110 transition-all"
              >
                <Plus size={16} />
                New Job
              </Link>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No active jobs found"
                subtitle={
                  <Link href="/admin/jobs/new" className="text-accent-green hover:underline">
                    Create one →
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-180 text-sm">
                  <thead>
                    <tr className="border-b border-border-dim">
                      {['Title', 'Company', 'Skills', 'Status', 'Created', 'Actions'].map(
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
                    {jobs.map((job) => (
                      <tr
                        key={job._id}
                        className="border-b border-border-dim last:border-0 hover:bg-bg-elevated transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/jobs/${job._id}/applicants`}
                            className="text-text-primary font-medium hover:text-accent-blue transition-colors"
                          >
                            {job.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{job.company}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {job.required_skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="inline-block bg-bg-elevated border border-border-dim text-text-secondary font-mono text-xs px-2 py-0.5 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.required_skills.length > 3 && (
                              <span className="text-text-muted text-xs self-center">
                                +{job.required_skills.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleStatus(job)}
                            disabled={togglingId === job._id}
                            className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors disabled:opacity-50 ${
                              job.status === 'active'
                                ? 'bg-[#00E5A0]/10 border-[#00E5A0]/30 text-accent-green hover:bg-[#00E5A0]/20'
                                : 'bg-bg-elevated border-border-dim text-text-muted hover:border-border-bright'
                            }`}
                          >
                            {job.status === 'active' ? 'Active' : 'Archived'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-text-muted font-mono text-xs whitespace-nowrap">
                          {formatDate(job.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/admin/jobs/${job._id}`}
                              className="text-text-muted hover:text-text-secondary transition-colors"
                              title="Edit job"
                            >
                              <Pencil size={15} />
                            </Link>
                            <button
                              onClick={() => setJobToDelete(job)}
                              className="text-text-muted hover:text-accent-red transition-colors"
                              title="Delete job"
                            >
                              <Trash2 size={15} />
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

        {/* Delete confirm dialog */}
        <Dialog.Root
          open={!!jobToDelete}
          onOpenChange={(open) => !open && setJobToDelete(null)}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-bg-surface border border-border-dim rounded-xl p-6 shadow-xl focus:outline-none">
              <Dialog.Title className="text-text-primary font-semibold text-base mb-2">
                Delete this job?
              </Dialog.Title>
              <Dialog.Description className="text-accent-red text-sm mb-6">
                This action cannot be undone.
              </Dialog.Description>
              <div className="flex gap-3 justify-end">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 rounded-lg border border-border-dim text-text-secondary text-sm hover:border-border-bright transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-accent-red text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </AdminGuard>
  );
}
