'use client';

import { useState, useEffect } from 'react';
import { Pencil, X, Check, FileText, Send, TrendingUp, Loader2 } from 'lucide-react';
import { getUser, setToken } from '@/lib/auth';
import { ResumePanel } from '@/components/ResumePanel';
import { ApplicationsPanel } from '@/components/ApplicationsPanel';
import { SkeletonProfileStat } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';
import api from '@/lib/api';

interface UserStats {
  resume_count: number;
  application_count: number;
  avg_match_score: number | null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Tab = 'resumes' | 'applications';

export default function ProfilePage() {
  const toast = useToast();
  const [user, setUser] = useState(() => getUser());
  const [tab, setTab] = useState<Tab>('resumes');
  const [stats, setStats] = useState<UserStats>({
    resume_count: 0,
    application_count: 0,
    avg_match_score: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const refreshStats = async () => {
    try {
      const { data } = await api.get<UserStats>('/users/stats');
      setStats({
        resume_count: data.resume_count ?? 0,
        application_count: data.application_count ?? 0,
        avg_match_score: data.avg_match_score ?? null,
      });
    } catch {
      // ignore — stats will fall back to defaults
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  function openEdit() {
    setForm({
      full_name: user?.full_name ?? '',
      email: user?.email ?? '',
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function handleSave() {
    const payload: Record<string, string> = {};
    const trimmedName = form.full_name.trim();
    const trimmedEmail = form.email.trim();
    const currentPw = form.current_password.trim();
    const newPw = form.new_password.trim();
    const confirmPw = form.confirm_password.trim();

    if (trimmedName && trimmedName !== user?.full_name) payload.full_name = trimmedName;
    if (trimmedEmail && trimmedEmail !== user?.email) payload.email = trimmedEmail;

    if (currentPw || newPw || confirmPw) {
      if (!currentPw) {
        toast.error('Please enter your current password');
        return;
      }
      if (!newPw) {
        toast.error('Please enter a new password');
        return;
      }
      if (newPw !== confirmPw) {
        toast.error('New passwords do not match');
        return;
      }
      if (newPw.length < 8) {
        toast.error('New password must be at least 8 characters');
        return;
      }
      payload.current_password = currentPw;
      payload.new_password = newPw;
    }

    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', payload);
      setToken(data.access_token);
      setUser(getUser());
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      handleApiError(err, toast, { fallback: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  }

  const displayUser = user;
  const initials = displayUser ? getInitials(displayUser.full_name || displayUser.email) : '?';

  const inputClass =
    'w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-green/60 transition-colors placeholder:text-text-muted';

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* User card */}
        <div className="bg-bg-surface border border-border-dim rounded-2xl p-6 mb-6 shadow-soft">
          {editing ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-text-primary font-semibold text-base">Edit Profile</h2>
                <button
                  onClick={cancelEdit}
                  className="text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-bg-elevated"
                  aria-label="Cancel editing"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-muted text-xs font-mono uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    className={inputClass}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-text-muted text-xs font-mono uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-border-dim">
                  <p className="text-text-muted text-xs font-mono uppercase tracking-wider mb-3 mt-2">
                    Change Password
                    <span className="normal-case ml-1.5 text-text-muted/70">(leave blank to keep current)</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-text-muted text-xs mb-1.5">Current Password</label>
                      <input
                        type="password"
                        value={form.current_password}
                        onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
                        autoComplete="new-password"
                        className={inputClass}
                        placeholder="Current"
                      />
                    </div>
                    <div>
                      <label className="block text-text-muted text-xs mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={form.new_password}
                        onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
                        autoComplete="new-password"
                        className={inputClass}
                        placeholder="Min. 8 chars"
                      />
                    </div>
                    <div>
                      <label className="block text-text-muted text-xs mb-1.5">Confirm</label>
                      <input
                        type="password"
                        value={form.confirm_password}
                        onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
                        autoComplete="new-password"
                        className={inputClass}
                        placeholder="Repeat new"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg border border-border-dim text-text-secondary text-sm hover:border-border-bright hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-green text-bg-base font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full blur-md opacity-50"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(79, 142, 247, 0.4) 0%, transparent 70%)',
                  }}
                />
                <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-accent-blue/30 to-accent-blue/10 border border-accent-blue/30 flex items-center justify-center">
                  <span className="text-accent-blue font-mono font-bold text-lg">{initials}</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-text-primary font-semibold text-lg truncate">
                  {displayUser?.full_name || '—'}
                </div>
                <div className="text-text-secondary text-sm truncate">{displayUser?.email}</div>
                <span className="mt-1.5 inline-flex items-center text-text-secondary font-mono text-xs border border-border-dim bg-bg-elevated rounded-full px-2.5 py-0.5 capitalize">
                  {displayUser?.role ?? 'user'}
                </span>
              </div>
              <button
                onClick={openEdit}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border-dim text-text-secondary text-sm hover:border-accent-green/40 hover:text-accent-green transition-all"
              >
                <Pencil size={14} />
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {statsLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonProfileStat key={i} />)
            : [
                {
                  label: 'Resumes Uploaded',
                  value: stats.resume_count,
                  icon: FileText,
                  color: 'text-accent-green',
                },
                {
                  label: 'Applications Sent',
                  value: stats.application_count,
                  icon: Send,
                  color: 'text-accent-blue',
                },
                {
                  label: 'Avg Match Score',
                  value:
                    stats.avg_match_score == null
                      ? '—'
                      : `${Math.round(stats.avg_match_score)}%`,
                  icon: TrendingUp,
                  color: 'text-accent-amber',
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-bg-surface border border-border-dim rounded-xl p-4 hover:border-border-bright transition-colors"
                >
                  <Icon size={16} className={`${color} mb-2`} />
                  <div className={`font-mono ${color} text-2xl font-bold`}>{value}</div>
                  <div className="text-text-muted text-xs mt-0.5 font-medium">{label}</div>
                </div>
              ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-border-dim mb-6">
          <div className="flex gap-1">
            {(['resumes', 'applications'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  tab === t
                    ? 'relative px-4 py-3 text-text-primary text-sm font-medium capitalize'
                    : 'px-4 py-3 text-text-secondary hover:text-text-primary text-sm font-medium capitalize transition-colors'
                }
              >
                {t}
                {tab === t && (
                  <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-accent-green" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in">
          {tab === 'resumes' ? (
            <ResumePanel onResumeCountChange={() => { refreshStats(); }} />
          ) : (
            <ApplicationsPanel />
          )}
        </div>
      </div>
    </div>
  );
}
