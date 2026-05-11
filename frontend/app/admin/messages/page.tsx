'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowLeft,
  MailOpen,
  MailQuestion,
  Trash2,
  Inbox,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';
import { AdminGuard } from '@/components/AdminGuard';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface ContactMessage {
  id: string;
  name: string;
  contact_info: string;
  reason: string;
  read: boolean;
  submitted_at: string;
  read_at: string | null;
}

function formatDateTime(value: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const toast = useToast();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeMessage, setActiveMessage] = useState<ContactMessage | null>(null);

  const fetchMessages = useCallback(() => {
    setLoading(true);
    api
      .get('/contact/admin/list')
      .then(({ data }) => setMessages(data.messages ?? []))
      .catch((err) => handleApiError(err, toast))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  async function handleToggleRead(message: ContactMessage) {
    const newRead = !message.read;
    setTogglingId(message.id);
    try {
      await api.patch(`/contact/admin/${message.id}`, { read: newRead });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id
            ? { ...m, read: newRead, read_at: newRead ? new Date().toISOString() : null }
            : m
        )
      );
    } catch (err) {
      handleApiError(err, toast, { fallback: 'Failed to update message' });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!messageToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/contact/admin/${messageToDelete.id}`);
      setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
      toast.success('Message deleted');
      setMessageToDelete(null);
    } catch (err) {
      handleApiError(err, toast, { fallback: 'Failed to delete message' });
    } finally {
      setDeleting(false);
    }
  }

  const unreadCount = messages.filter((m) => !m.read).length;
  const visible = messages.filter((m) =>
    filter === 'all' ? true : filter === 'unread' ? !m.read : m.read
  );

  return (
    <AdminGuard>
      <div className="min-h-screen bg-bg-base">
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
              <div className="w-10 h-10 rounded-lg bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center">
                <Inbox size={18} className="text-accent-blue" />
              </div>
              <div>
                <h1 className="text-text-primary font-bold text-xl tracking-tight">Contact Submissions</h1>
                <p className="text-text-muted text-xs font-mono mt-0.5">System Administrator</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
            <div className="bg-bg-surface border border-border-dim rounded-xl px-5 py-4">
              <Inbox size={14} className="text-accent-blue mb-2" />
              <div className="font-mono text-text-primary text-2xl font-bold">
                {loading ? '—' : messages.length}
              </div>
              <div className="text-text-muted text-xs uppercase font-mono tracking-wider">Total</div>
            </div>
            <div className="bg-bg-surface border border-border-dim rounded-xl px-5 py-4">
              <MailQuestion size={14} className="text-accent-amber mb-2" />
              <div className="font-mono text-text-primary text-2xl font-bold">
                {loading ? '—' : unreadCount}
              </div>
              <div className="text-text-muted text-xs uppercase font-mono tracking-wider">Unread</div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg border font-mono text-xs uppercase tracking-wider transition-colors ${
                  filter === f
                    ? 'bg-accent-green text-bg-base border-accent-green font-semibold'
                    : 'bg-bg-surface border-border-dim text-text-muted hover:border-border-bright hover:text-text-primary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="bg-bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-soft">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No messages"
                subtitle={
                  filter === 'all'
                    ? 'Contact form submissions will appear here.'
                    : `No ${filter} messages.`
                }
              />
            ) : (
              <ul className="divide-y divide-border-dim">
                {visible.map((m) => (
                  <li
                    key={m.id}
                    className={`transition-colors relative ${m.read ? '' : 'bg-accent-amber/2'}`}
                  >
                    {!m.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-amber" />
                    )}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveMessage(m)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveMessage(m);
                        }
                      }}
                      className="px-6 py-5 cursor-pointer hover:bg-bg-elevated/40 focus:bg-bg-elevated/40 focus:outline-none transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-text-primary font-medium text-sm">{m.name}</span>
                            <span className="text-text-secondary font-mono text-xs">
                              {m.contact_info}
                            </span>
                            {!m.read && (
                              <span className="inline-block bg-accent-amber/10 border border-accent-amber/30 text-accent-amber font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                                Unread
                              </span>
                            )}
                          </div>
                          <div className="text-text-muted font-mono text-xs mt-0.5">
                            {formatDateTime(m.submitted_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleRead(m);
                            }}
                            disabled={togglingId === m.id}
                            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors disabled:opacity-50"
                            title={m.read ? 'Mark as unread' : 'Mark as read'}
                          >
                            {m.read ? <MailQuestion size={15} /> : <MailOpen size={15} />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMessageToDelete(m);
                            }}
                            className="p-1.5 rounded-md text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                            title="Delete message"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <p className="text-text-secondary text-sm line-clamp-2 leading-relaxed">{m.reason}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Dialog.Root
          open={!!activeMessage}
          onOpenChange={(open) => !open && setActiveMessage(null)}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-bg-surface border border-border-dim rounded-2xl p-6 shadow-elevated focus:outline-none animate-fade-in-up">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <Dialog.Title className="text-text-primary font-semibold text-lg">
                    {activeMessage?.name || 'Contact submission'}
                  </Dialog.Title>
                  <Dialog.Description className="text-text-secondary text-sm mt-0.5 wrap-break-word">
                    {activeMessage?.contact_info}
                  </Dialog.Description>
                </div>
                {activeMessage && !activeMessage.read && (
                  <span className="shrink-0 inline-block bg-accent-amber/10 border border-accent-amber/30 text-accent-amber font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Unread
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-5">
                <div className="bg-bg-elevated border border-border-dim rounded-lg px-3 py-2.5">
                  <div className="text-text-muted uppercase tracking-wider mb-1">Submitted</div>
                  <div className="text-text-secondary">
                    {activeMessage ? formatDateTime(activeMessage.submitted_at) : '—'}
                  </div>
                </div>
                <div className="bg-bg-elevated border border-border-dim rounded-lg px-3 py-2.5">
                  <div className="text-text-muted uppercase tracking-wider mb-1">Read</div>
                  <div className="text-text-secondary">
                    {activeMessage?.read
                      ? formatDateTime(activeMessage.read_at ?? '')
                      : 'Not yet read'}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-text-muted uppercase tracking-wider text-xs font-mono mb-2">
                  Reason
                </div>
                <p className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed bg-bg-elevated border border-border-dim rounded-lg p-4">
                  {activeMessage?.reason}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 justify-end">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 rounded-lg border border-border-dim text-text-secondary text-sm hover:border-border-bright hover:text-text-primary transition-colors">
                    Close
                  </button>
                </Dialog.Close>
                {activeMessage && (
                  <>
                    <button
                      onClick={() => {
                        const m = activeMessage;
                        handleToggleRead(m);
                        setActiveMessage((prev) =>
                          prev && prev.id === m.id ? { ...prev, read: !prev.read } : prev
                        );
                      }}
                      disabled={togglingId === activeMessage.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border-dim text-text-secondary text-sm hover:border-border-bright hover:text-text-primary transition-colors disabled:opacity-50"
                    >
                      {activeMessage.read ? (
                        <>
                          <MailQuestion size={14} />
                          Mark as unread
                        </>
                      ) : (
                        <>
                          <MailOpen size={14} />
                          Mark as read
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setMessageToDelete(activeMessage);
                        setActiveMessage(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-red text-white text-sm font-semibold hover:brightness-110 transition-all"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <Dialog.Root
          open={!!messageToDelete}
          onOpenChange={(open) => !open && setMessageToDelete(null)}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-bg-surface border border-border-dim rounded-2xl p-6 shadow-elevated focus:outline-none animate-fade-in-up">
              <Dialog.Title className="text-text-primary font-semibold text-base mb-2">
                Delete this message?
              </Dialog.Title>
              <Dialog.Description className="text-text-secondary text-sm mb-1">
                Submission from{' '}
                <span className="font-medium text-text-primary">{messageToDelete?.name}</span> will
                be permanently removed.
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
