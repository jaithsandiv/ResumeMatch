'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, ShieldCheck, ShieldOff, Trash2, Users } from 'lucide-react';
import api from '@/lib/api';
import { AdminGuard } from '@/components/AdminGuard';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { getUser } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'visitor';
}

function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminUsersPage() {
  const toast = useToast();
  const router = useRouter();
  const currentUser = getUser();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    api
      .get('/users/admin/list')
      .then(({ data }) => setUsers(data.users ?? []))
      .catch((err) => handleApiError(err, toast))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleDelete() {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/users/admin/${userToDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast.success(`${userToDelete.full_name || userToDelete.email} has been deleted`);
      setUserToDelete(null);
    } catch (err) {
      handleApiError(err, toast, { fallback: 'Failed to delete user' });
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleRole() {
    if (!userToToggle) return;
    const newRole = userToToggle.role === 'admin' ? 'visitor' : 'admin';
    setToggling(true);
    try {
      await api.patch(`/users/admin/${userToToggle.id}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userToToggle.id ? { ...u, role: newRole } : u))
      );
      toast.success(
        newRole === 'admin'
          ? `${userToToggle.full_name || userToToggle.email} is now an admin`
          : `${userToToggle.full_name || userToToggle.email} is now a visitor`
      );
      setUserToToggle(null);
    } catch (err) {
      handleApiError(err, toast, { fallback: 'Failed to update role' });
    } finally {
      setToggling(false);
    }
  }

  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-bg-base">
        {/* Header */}
        <div className="bg-bg-surface border-b border-border-dim px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-text-primary font-bold text-xl">User Management</h1>
            <span className="bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-accent-green font-mono text-xs px-2.5 py-1 rounded-full">
              System Administrator
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-xs">
            <div className="bg-bg-elevated border border-border-dim rounded-lg px-5 py-4">
              <div className="font-mono text-accent-green text-2xl font-bold mb-0.5">
                {loading ? '—' : users.length}
              </div>
              <div className="text-text-muted text-xs uppercase font-mono tracking-wider">Total Users</div>
            </div>
            <div className="bg-bg-elevated border border-border-dim rounded-lg px-5 py-4">
              <div className="font-mono text-accent-green text-2xl font-bold mb-0.5">
                {loading ? '—' : adminCount}
              </div>
              <div className="text-text-muted text-xs uppercase font-mono tracking-wider">Admins</div>
            </div>
          </div>

          {/* Users table */}
          <div className="bg-bg-surface border border-border-dim rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-dim">
              <h2 className="text-text-primary font-semibold text-base">All Users</h2>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <EmptyState icon={Users} title="No users found" subtitle="Users will appear here after registration" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-120 text-sm">
                  <thead>
                    <tr className="border-b border-border-dim">
                      {['User', 'Email', 'Role', 'Actions'].map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-text-muted font-mono text-xs uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      return (
                        <tr
                          key={u.id}
                          className="border-b border-border-dim last:border-0 hover:bg-bg-elevated transition-colors"
                        >
                          {/* Avatar + name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-mono font-bold"
                                style={{
                                  backgroundColor: 'rgb(79 142 247 / 0.15)',
                                  border: '1px solid rgb(79 142 247 / 0.25)',
                                  color: 'rgb(79 142 247)',
                                }}
                              >
                                {getInitials(u.full_name || u.email)}
                              </div>
                              <div>
                                <div className="text-text-primary font-medium text-sm">
                                  {u.full_name || '—'}
                                  {isSelf && (
                                    <span className="ml-2 text-text-muted font-mono text-xs">(you)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3 text-text-secondary text-sm">{u.email}</td>

                          {/* Role badge */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block font-mono text-xs px-2.5 py-1 rounded-full border ${
                                u.role === 'admin'
                                  ? 'bg-[#00E5A0]/10 border-[#00E5A0]/30 text-accent-green'
                                  : 'bg-bg-elevated border-border-dim text-text-muted'
                              }`}
                            >
                              {u.role === 'admin' ? 'Admin' : 'Visitor'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {!isSelf && (
                                <>
                                  <button
                                    onClick={() => setUserToToggle(u)}
                                    className="text-text-muted hover:text-text-secondary transition-colors"
                                    title={u.role === 'admin' ? 'Demote to visitor' : 'Promote to admin'}
                                  >
                                    {u.role === 'admin' ? (
                                      <ShieldOff size={15} />
                                    ) : (
                                      <ShieldCheck size={15} />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setUserToDelete(u)}
                                    className="text-text-muted hover:text-accent-red transition-colors"
                                    title="Delete user"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Delete confirm dialog */}
        <Dialog.Root open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-bg-surface border border-border-dim rounded-xl p-6 shadow-xl focus:outline-none">
              <Dialog.Title className="text-text-primary font-semibold text-base mb-2">
                Delete user?
              </Dialog.Title>
              <Dialog.Description className="text-text-secondary text-sm mb-1">
                <span className="font-medium text-text-primary">
                  {userToDelete?.full_name || userToDelete?.email}
                </span>{' '}
                will be permanently removed along with all their resumes and applications.
              </Dialog.Description>
              <p className="text-accent-red text-xs mb-6">This action cannot be undone.</p>
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
                  {deleting ? 'Deleting…' : 'Delete User'}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Role toggle confirm dialog */}
        <Dialog.Root open={!!userToToggle} onOpenChange={(open) => !open && setUserToToggle(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-bg-surface border border-border-dim rounded-xl p-6 shadow-xl focus:outline-none">
              <Dialog.Title className="text-text-primary font-semibold text-base mb-2">
                {userToToggle?.role === 'admin' ? 'Demote to visitor?' : 'Promote to admin?'}
              </Dialog.Title>
              <Dialog.Description className="text-text-secondary text-sm mb-6">
                <span className="font-medium text-text-primary">
                  {userToToggle?.full_name || userToToggle?.email}
                </span>{' '}
                will{' '}
                {userToToggle?.role === 'admin'
                  ? 'lose admin privileges and become a regular visitor.'
                  : 'gain full admin access to the platform.'}
              </Dialog.Description>
              <div className="flex gap-3 justify-end">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 rounded-lg border border-border-dim text-text-secondary text-sm hover:border-border-bright transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleToggleRole}
                  disabled={toggling}
                  className="px-4 py-2 rounded-lg bg-accent-green text-bg-base text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {toggling
                    ? 'Updating…'
                    : userToToggle?.role === 'admin'
                    ? 'Demote'
                    : 'Promote'}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </AdminGuard>
  );
}
