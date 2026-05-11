'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Pencil,
  Trash2,
  Plus,
  Briefcase,
  Loader2,
  ShieldCheck,
  FileText,
  Send,
  Users,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import api from '@/lib/api';
import { AdminGuard } from '@/components/AdminGuard';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Job } from '@/components/JobCard';
import { isSystemAdmin } from '@/lib/auth';

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
  const [stats, setStats] = useState<{
    total_resumes: number;
    total_applications: number;
    total_users?: number;
    unread_messages?: number;
  } | null>(null);

  useEffect(() => {
    api
      .get('/jobs/admin/list')
      .then(({ data }) => setJobs(data.jobs ?? []))
      .catch((err) => handleApiError(err, toast))
      .finally(() => setLoading(false));
  }, [toast]);

  const sysAdmin = isSystemAdmin();

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

  type StatTile = {
    label: string;
    value: string;
    icon: typeof Briefcase;
    iconColor: string;
    href: string | null;
    hint: string | null;
  };

  const tiles: StatTile[] = [
    {
      label: 'Active Jobs',
      value: loading ? '—' : String(activeCount),
      icon: Briefcase,
      iconColor: 'text-accent-green',
      href: null,
      hint: null,
    },
    {
      label: 'Total Resumes',
      value: stats ? String(stats.total_resumes) : '—',
      icon: FileText,
      iconColor: 'text-accent-blue',
      href: null,
      hint: null,
    },
    {
      label: 'Applications',
      value: stats ? String(stats.total_applications) : '—',
      icon: Send,
      iconColor: 'text-accent-amber',
      href: null,
      hint: null,
    },
    ...(sysAdmin
      ? ([
          {
            label: 'Users',
            value: stats?.total_users != null ? String(stats.total_users) : '—',
            icon: Users,
            iconColor: 'text-accent-purple',
            href: '/admin/users',
            hint: 'Manage users',
          },
          {
            label: 'Messages',
            value: stats?.unread_messages != null ? String(stats.unread_messages) : '—',
            icon: Inbox,
            iconColor: 'text-accent-blue',
            href: '/admin/messages',
            hint: 'View inbox',
          },
        ] as StatTile[])
      : []),
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-bg-base">
        {/* Admin header */}
        <div className="bg-bg-surface border-b border-border-dim px-6 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-green/10 border border-accent-green/30 flex items-center justify-center">
                <ShieldCheck size={18} className="text-accent-green" />
              </div>
              <div>
                <h1 className="text-text-primary font-bold text-xl tracking-tight">Admin Panel</h1>
                <p className="text-text-muted text-xs font-mono mt-0.5">
                  {sysAdmin ? 'System Administrator' : 'Administrator'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Stats row */}
          <div className={`grid grid-cols-2 ${sysAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-4 mb-10`}>
            {tiles.map(({ label, value, icon: Icon, iconColor, href, hint }) => {
              const inner = (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <Icon size={16} className={iconColor} />
                    {href && <ArrowRight size={13} className="text-text-muted group-hover:text-text-primary transition-colors" />}
                  </div>
                  <div className="font-mono text-text-primary text-3xl font-bold mb-1">{value}</div>
                  <div className="text-text-muted text-xs uppercase font-mono tracking-wider">{label}</div>
                  {hint && (
                    <div className="text-accent-green/80 text-[10px] uppercase font-mono tracking-wider mt-2">
                      {hint}
                    </div>
                  )}
                </>
              );
              return href ? (
                <Link
                  key={label}
                  href={href}
                  className="group bg-bg-surface border border-border-dim rounded-xl px-5 py-5 hover:border-accent-green/30 transition-all card-lift"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={label}
                  className="bg-bg-surface border border-border-dim rounded-xl px-5 py-5"
                >
                  {inner}
                </div>
              );
            })}
          </div>

          {/* Jobs table */}
          <div className="bg-bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-soft">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-dim">
              <div>
                <h2 className="text-text-primary font-semibold text-base">Job Listings</h2>
                {!loading && (
                  <p className="text-text-muted text-xs font-mono mt-0.5">
                    {jobs.length} total · {activeCount} active
                  </p>
                )}
              </div>
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
                title="No jobs yet"
                subtitle={
                  <Link href="/admin/jobs/new" className="inline-flex items-center gap-1 text-accent-green hover:underline">
                    Create your first job <ArrowRight size={13} />
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-180 text-sm">
                  <thead className="bg-bg-elevated/50">
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
                        className="border-b border-border-dim last:border-0 hover:bg-bg-elevated/40 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/admin/jobs/${job._id}/applicants`}
                            className="text-text-primary font-medium hover:text-accent-blue transition-colors"
                          >
                            {job.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-text-secondary">{job.company}</td>
                        <td className="px-4 py-3.5">
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
                              <span className="text-text-muted text-xs self-center font-mono">
                                +{job.required_skills.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => handleToggleStatus(job)}
                            disabled={togglingId === job._id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border transition-colors disabled:opacity-50 ${
                              job.status === 'active'
                                ? 'bg-accent-green/10 border-accent-green/30 text-accent-green hover:bg-accent-green/20'
                                : 'bg-bg-elevated border-border-dim text-text-muted hover:border-border-bright'
                            }`}
                          >
                            {togglingId === job._id ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              job.status === 'active' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                              )
                            )}
                            {job.status === 'active' ? 'Active' : 'Archived'}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-text-muted font-mono text-xs whitespace-nowrap">
                          {formatDate(job.created_at)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/admin/jobs/${job._id}`}
                              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                              title="Edit job"
                            >
                              <Pencil size={14} />
                            </Link>
                            <button
                              onClick={() => setJobToDelete(job)}
                              className="p-1.5 rounded-md text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                              title="Delete job"
                            >
                              <Trash2 size={14} />
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
            <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-bg-surface border border-border-dim rounded-2xl p-6 shadow-elevated focus:outline-none animate-fade-in-up">
              <Dialog.Title className="text-text-primary font-semibold text-base mb-2">
                Delete this job?
              </Dialog.Title>
              <Dialog.Description className="text-text-secondary text-sm mb-1">
                <span className="font-medium text-text-primary">{jobToDelete?.title}</span> will be permanently removed.
              </Dialog.Description>
              <p className="text-accent-red text-xs mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 rounded-lg border border-border-dim text-text-secondary text-sm hover:border-border-bright hover:text-text-primary transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-red text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </AdminGuard>
  );
}
