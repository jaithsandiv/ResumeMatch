'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  Loader2,
} from 'lucide-react';
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
  role: 'admin' | 'visitor' | 'system_administrator';
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

  const adminCount = users.filter(
    (u) => u.role === 'admin' || u.role === 'system_administrator'
  ).length;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-bg-base">
        {/* Header */}
        <div className="bg-bg-surface border-b border-border-dim px-6 py-5">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="text-text-muted hover:text-text-primary p-1.5 rounded-md hover:bg-bg-elevated transition-colors"
              aria-label="Back to admin"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center">
                <Users size={18} className="text-accent-purple" />
              </div>
              <div>
                <h1 className="text-text-primary font-bold text-xl tracking-tight">User Management</h1>
                <p className="text-text-muted text-xs font-mono mt-0.5">System Administrator</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
            <div className="bg-bg-surface border border-border-dim rounded-xl px-5 py-4">
              <Users size={14} className="text-accent-blue mb-2" />
              <div className="font-mono text-text-primary text-2xl font-bold">
                {loading ? '—' : users.length}
              </div>
              <div className="text-text-muted text-xs uppercase font-mono tracking-wider">Total Users</div>
            </div>
            <div className="bg-bg-surface border border-border-dim rounded-xl px-5 py-4">
              <ShieldCheck size={14} className="text-accent-green mb-2" />
              <div className="font-mono text-text-primary text-2xl font-bold">
                {loading ? '—' : adminCount}
              </div>
              <div className="text-text-muted text-xs uppercase font-mono tracking-wider">Admins</div>
            </div>
          </div>

          {/* Users table */}
          <div className="bg-bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-soft">
            <div className="px-6 py-4 border-b border-border-dim">
              <h2 className="text-text-primary font-semibold text-base">All Users</h2>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users found"
                subtitle="Users will appear here after registration"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-120 text-sm">
                  <thead className="bg-bg-elevated/50">
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
                      const isSysAdminRow = u.role === 'system_administrator';
                      const viewerIsSysAdmin = currentUser?.role === 'system_administrator';
                      const canManage = !isSelf && (!isSysAdminRow || viewerIsSysAdmin);
                      return (
                        <tr
                          key={u.id}
                          className="border-b border-border-dim last:border-0 hover:bg-bg-elevated/40 transition-colors"
                        >
                          {/* Avatar + name */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-linear-to-br from-accent-blue/25 to-accent-blue/10 border border-accent-blue/30 flex items-center justify-center shrink-0 text-xs font-mono font-bold text-accent-blue">
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
                          <td className="px-4 py-3.5 text-text-secondary text-sm">{u.email}</td>

                          {/* Role badge */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-full border ${
                                isSysAdminRow
                                  ? 'bg-accent-blue/10 border-accent-blue/30 text-accent-blue'
                                  : u.role === 'admin'
                                  ? 'bg-accent-green/10 border-accent-green/30 text-accent-green'
                                  : 'bg-bg-elevated border-border-dim text-text-muted'
                              }`}
                            >
                              {isSysAdminRow ? (
                                <>
                                  <ShieldCheck size={10} />
                                  System Admin
                                </>
                              ) : u.role === 'admin' ? (
                                <>
                                  <ShieldCheck size={10} />
                                  Admin
                                </>
                              ) : (
                                'Visitor'
                              )}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              {canManage && (
                                <>
                                  {!isSysAdminRow && (
                                    <button
                                      onClick={() => setUserToToggle(u)}
                                      className="p-1.5 rounded-md text-text-muted hover:text-accent-green hover:bg-accent-green/10 transition-colors"
                                      title={u.role === 'admin' ? 'Demote to visitor' : 'Promote to admin'}
                                    >
                                      {u.role === 'admin' ? (
                                        <ShieldOff size={14} />
                                      ) : (
                                        <ShieldCheck size={14} />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setUserToDelete(u)}
                                    className="p-1.5 rounded-md text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                                    title="Delete user"
                                  >
                                    <Trash2 size={14} />
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
            <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-bg-surface border border-border-dim rounded-2xl p-6 shadow-elevated focus:outline-none animate-fade-in-up">
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
                    'Delete User'
                  )}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Role toggle confirm dialog */}
        <Dialog.Root open={!!userToToggle} onOpenChange={(open) => !open && setUserToToggle(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-bg-surface border border-border-dim rounded-2xl p-6 shadow-elevated focus:outline-none animate-fade-in-up">
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
                  <button className="px-4 py-2 rounded-lg border border-border-dim text-text-secondary text-sm hover:border-border-bright hover:text-text-primary transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleToggleRole}
                  disabled={toggling}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-green text-bg-base text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {toggling ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Updating…
                    </>
                  ) : userToToggle?.role === 'admin' ? (
                    'Demote'
                  ) : (
                    'Promote'
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
