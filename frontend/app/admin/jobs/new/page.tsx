'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import api from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';
import { AdminGuard } from '@/components/AdminGuard';
import { SkillsTagInput } from '@/components/SkillsTagInput';
import { useToast } from '@/components/Toast';

const inputClass =
  'w-full bg-bg-elevated border border-border-dim rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-border-bright transition-colors';

export default function NewJobPage() {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/jobs/', {
        title,
        company,
        location,
        salary_range: salaryRange,
        description,
        required_skills: skills,
        status,
      });
      toast.success('Job created successfully');
      router.push('/admin');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      setError(detail ?? 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-bg-base">
        <Navbar />

        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-text-secondary text-sm hover:text-text-primary transition-colors mb-4"
            >
              <ChevronLeft size={16} />
              Back to Admin
            </Link>
            <h1 className="text-text-primary font-bold text-2xl">Create Job Posting</h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-bg-surface border border-border-dim rounded-xl p-8 space-y-6"
          >
            <div>
              <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                Job Title <span className="text-accent-red">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                Company <span className="text-accent-red">*</span>
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or Remote"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                Salary Range
              </label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. 80k-120k"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role, responsibilities, and requirements…"
                className={`${inputClass} min-h-32 resize-y`}
              />
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">
                Required Skills
              </label>
              <SkillsTagInput skills={skills} onChange={setSkills} />
              <p className="text-text-muted text-xs mt-1.5">
                Press Enter or comma to add a skill
              </p>
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-mono uppercase tracking-wider mb-3">
                Status
              </label>
              <div className="flex gap-3">
                {(['active', 'draft'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-5 py-2 rounded-lg border font-mono text-sm transition-colors capitalize ${
                      status === s
                        ? 'bg-accent-green text-bg-base border-accent-green font-semibold'
                        : 'bg-bg-elevated border-border-dim text-text-muted hover:border-border-bright'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-accent-red text-sm">{error}</p>}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-accent-green text-bg-base font-semibold px-6 py-2.5 rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating…' : 'Create Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminGuard>
  );
}
