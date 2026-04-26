'use client';

import { useState, useEffect } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { getUser, setToken } from '@/lib/auth';
import { ResumePanel } from '@/components/ResumePanel';
import { ApplicationsPanel } from '@/components/ApplicationsPanel';
import { SkeletonProfileStat } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';
import api from '@/lib/api';

interface StoredResume {
  resume_id: string;
  filename: string;
  parse_status: string;
  uploaded_at: string;
}

interface StoredApplication {
  application_id: string;
  job_id: string;
  job_title: string;
  company: string;
  resume_id: string;
  status: string;
  applied_at: string;
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
  const [resumeCount, setResumeCount] = useState(0);
  const [appCount, setAppCount] = useState(0);
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

  useEffect(() => {
    try {
      const resumes: StoredResume[] = JSON.parse(localStorage.getItem('rm_resumes') ?? '[]');
      const apps: StoredApplication[] = JSON.parse(localStorage.getItem('rm_applications') ?? '[]');
      setResumeCount(resumes.length);
      setAppCount(apps.length);
    } catch {
      // ignore parse errors
    } finally {
      setStatsLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* User card */}
        <div className="bg-bg-surface border border-border-dim rounded-xl p-6 mb-6">
          {editing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-text-primary font-semibold text-base">Edit Profile</h2>
                <button
                  onClick={cancelEdit}
                  className="text-text-muted hover:text-text-secondary transition-colors"
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
                    className="w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-blue transition-colors"
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
                    className="w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-blue transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <p className="text-text-muted text-xs font-mono uppercase tracking-wider mb-3">
                    Change Password
                    <span className="normal-case ml-1">(leave blank to keep current)</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-text-muted text-xs mb-1.5">Current Password</label>
                      <input
                        type="password"
                        value={form.current_password}
                        onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
                        autoComplete="new-password"
                        className="w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-blue transition-colors"
                        placeholder="Current password"
                      />
                    </div>
                    <div>
                      <label className="block text-text-muted text-xs mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={form.new_password}
                        onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
                        autoComplete="new-password"
                        className="w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-blue transition-colors"
                        placeholder="Min. 8 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-text-muted text-xs mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        value={form.confirm_password}
                        onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
                        autoComplete="new-password"
                        className="w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-blue transition-colors"
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg border border-border-dim text-text-secondary text-sm hover:border-border-bright transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-green text-bg-base font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <Check size={15} />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgb(79 142 247 / 0.2)', border: '1px solid rgb(79 142 247 / 0.3)' }}
              >
                <span className="text-accent-blue font-mono font-bold text-lg">{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-text-primary font-semibold text-base truncate">
                  {displayUser?.full_name || '—'}
                </div>
                <div className="text-text-secondary text-sm truncate">{displayUser?.email}</div>
                <span className="mt-1 inline-block text-text-muted font-mono text-xs border border-border-dim rounded px-2 py-0.5 capitalize">
                  {displayUser?.role ?? 'user'}
                </span>
              </div>
              <button
                onClick={openEdit}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-dim text-text-secondary text-sm hover:border-border-bright hover:text-text-primary transition-colors"
              >
                <Pencil size={14} />
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statsLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonProfileStat key={i} />)
            : [
                { label: 'Resumes Uploaded', value: resumeCount },
                { label: 'Applications Sent', value: appCount },
                { label: 'Avg Match Score', value: '—' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-bg-surface border border-border-dim rounded-lg p-4 text-center"
                >
                  <div className="font-mono text-accent-green text-2xl font-semibold">
                    {value}
                  </div>
                  <div className="text-text-muted text-xs mt-1">{label}</div>
                </div>
              ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-border-dim mb-6">
          <div className="flex gap-6">
            {(['resumes', 'applications'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  tab === t
                    ? 'pb-3 -mb-px border-b-2 border-accent-green text-text-primary text-sm font-medium capitalize'
                    : 'pb-3 -mb-px text-text-secondary hover:text-text-primary text-sm font-medium capitalize transition-colors'
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === 'resumes' ? (
          <ResumePanel onResumeCountChange={setResumeCount} />
        ) : (
          <ApplicationsPanel />
        )}
      </div>
    </div>
  );
}
