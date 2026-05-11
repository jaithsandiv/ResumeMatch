'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, MessageSquare, CheckCircle2, Loader2, Mail } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';

const inputClass =
  'w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-accent-green/60 transition-colors';

export default function ContactPage() {
  const toast = useToast();
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/contact/', {
        name,
        contact_info: contactInfo,
        reason,
      });
      toast.success('Message sent — thanks for reaching out');
      setSubmitted(true);
      setName('');
      setContactInfo('');
      setReason('');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      setError(detail ?? 'Failed to send message');
      handleApiError(err, toast, { fallback: 'Failed to send message' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-base relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 0%, rgba(0, 229, 160, 0.05), transparent 60%)',
        }}
      />

      <div className="max-w-xl mx-auto px-6 py-14 relative">
        <div className="flex justify-end mb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-secondary text-xs font-mono transition-colors px-2 py-1 rounded hover:bg-bg-surface"
          >
            <Home size={13} />
            Homepage
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Image src="/logo footer.svg" width={100} height={100} alt="ResumeMatch" />
          </div>
          <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full border border-accent-blue/30 bg-accent-blue/5 text-accent-blue text-xs font-mono">
            <Mail size={11} />
            Get in touch
          </div>
          <h1 className="text-text-primary font-bold text-3xl tracking-tight">Contact Us</h1>
          <p className="text-text-secondary text-sm mt-2">
            Questions, feedback, or partnership ideas — drop us a note.
          </p>
        </div>

        {submitted ? (
          <div className="bg-bg-surface border border-accent-green/30 rounded-2xl p-10 text-center space-y-4 shadow-soft animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-green/15 border border-accent-green/30">
              <CheckCircle2 size={26} className="text-accent-green" />
            </div>
            <div className="space-y-1.5">
              <p className="text-text-primary font-semibold text-base">Message received</p>
              <p className="text-text-secondary text-sm leading-relaxed max-w-sm mx-auto">
                Thanks for reaching out. We&apos;ll get back to you using the contact info you provided.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="inline-flex items-center gap-1.5 text-accent-blue text-sm hover:underline mt-2"
            >
              <MessageSquare size={13} />
              Send another message
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-bg-surface border border-border-dim rounded-2xl p-8 space-y-5 shadow-soft animate-fade-in-up"
          >
            <div>
              <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                Name <span className="text-accent-red">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                Contact Info <span className="text-accent-red">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Email or phone number"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                Reason <span className="text-accent-red">*</span>
              </label>
              <textarea
                required
                maxLength={2000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="How can we help?"
                className={`${inputClass} min-h-32 resize-y`}
              />
              <p className="text-text-muted text-xs mt-1.5 font-mono">{reason.length}/2000</p>
            </div>

            {error && (
              <div className="rounded-lg border border-accent-red/30 bg-accent-red/5 px-3 py-2.5">
                <p className="text-accent-red text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-accent-green text-bg-base font-semibold px-6 py-2.5 rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-green/0 hover:shadow-glow-green"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
