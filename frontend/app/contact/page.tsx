'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';

const inputClass =
  'w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-border-bright transition-colors';

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
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="flex justify-end mb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-secondary text-xs font-mono transition-colors"
          >
            <Home size={13} />
            Homepage
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/logo footer.svg" width={120} height={120} alt="ResumeMatch" />
          </div>
          <h1 className="text-text-primary font-bold text-2xl">Contact Us</h1>
          <p className="text-text-secondary text-sm mt-1">
            Questions, feedback, or partnership ideas — drop us a note.
          </p>
        </div>

        {submitted ? (
          <div className="bg-bg-surface border border-border-dim rounded-xl p-8 text-center space-y-4">
            <p className="text-accent-green font-mono text-sm">Message received.</p>
            <p className="text-text-secondary text-sm">
              We&apos;ll get back to you using the contact info you provided.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-accent-blue text-sm hover:underline"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-bg-surface border border-border-dim rounded-xl p-8 space-y-6"
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
            </div>

            {error && <p className="text-accent-red text-sm">{error}</p>}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-accent-green text-bg-base font-semibold px-6 py-2.5 rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
