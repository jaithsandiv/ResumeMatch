'use client';

import { useRouter } from 'next/navigation';
import { MapPin, Clock } from 'lucide-react';
import { SkillTag } from '@/components/ui/SkillTag';

export interface Job {
  _id: string;
  title: string;
  company: string;
  description: string;
  required_skills: string[];
  location: string;
  salary_range: string;
  status: string;
  created_at: string;
  created_by?: string;
  applicant_count?: number;
}

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diff === 0) return 'today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

export function JobCard({ job }: { job: Job }) {
  const router = useRouter();
  const visibleSkills = job.required_skills.slice(0, 4);
  const extraCount = job.required_skills.length - 4;

  return (
    <div
      onClick={() => router.push(`/jobs/${job._id}`)}
      className="group relative bg-bg-surface border border-border-dim rounded-xl p-5 hover:border-accent-green/30 transition-all duration-200 cursor-pointer card-lift overflow-hidden"
    >
      {/* Subtle accent on hover */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent-green/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Row 1: Title + Status badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-text-primary font-semibold text-base leading-snug group-hover:text-accent-green transition-colors line-clamp-2">
          {job.title}
        </h3>
        {job.status === 'active' && (
          <span className="shrink-0 inline-flex items-center gap-1 bg-accent-green/10 border border-accent-green/30 text-accent-green text-xs font-mono px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            Active
          </span>
        )}
      </div>

      {/* Row 2: Company + Location */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <span className="text-text-secondary text-sm font-medium truncate">{job.company}</span>
        {job.location && (
          <span className="inline-flex items-center gap-1 text-text-muted text-xs font-mono shrink-0">
            <MapPin size={11} />
            {job.location}
          </span>
        )}
      </div>

      {/* Row 3: Skill tags */}
      <div className="flex flex-wrap gap-1.5 mb-4 min-h-6">
        {visibleSkills.map((skill) => (
          <SkillTag key={skill} label={skill} variant="neutral" />
        ))}
        {extraCount > 0 && (
          <span className="text-text-muted text-xs font-mono self-center">
            +{extraCount} more
          </span>
        )}
      </div>

      {/* Row 4: Salary + Created */}
      <div className="flex items-center justify-between pt-3 border-t border-border-dim/60">
        <span className="text-accent-blue font-mono text-xs font-medium">
          {job.salary_range || '—'}
        </span>
        <span className="inline-flex items-center gap-1 text-text-muted text-xs">
          <Clock size={10} />
          {daysAgo(job.created_at)}
        </span>
      </div>
    </div>
  );
}
