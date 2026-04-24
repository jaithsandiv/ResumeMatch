'use client';

import { useRouter } from 'next/navigation';
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
      className="bg-bg-surface border border-border-dim rounded-lg p-5 hover:border-border-bright transition-colors cursor-pointer"
    >
      {/* Row 1: Title + Status badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-text-primary font-semibold text-base leading-snug">
          {job.title}
        </span>
        {job.status === 'active' && (
          <span className="shrink-0 bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-accent-green text-xs font-mono px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>

      {/* Row 2: Company + Location */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-text-secondary text-sm">{job.company}</span>
        <span className="text-text-muted text-xs font-mono">{job.location}</span>
      </div>

      {/* Row 3: Skill tags */}
      <div className="flex flex-wrap gap-1.5 mb-3 min-h-[1.5rem]">
        {visibleSkills.map((skill) => (
          <SkillTag key={skill} label={skill} variant="neutral" />
        ))}
        {extraCount > 0 && (
          <span className="text-text-muted text-xs self-center">+{extraCount} more</span>
        )}
      </div>

      {/* Row 4: Salary + Created */}
      <div className="flex items-center justify-between">
        <span className="text-accent-blue font-mono text-xs">{job.salary_range}</span>
        <span className="text-text-muted text-xs">{daysAgo(job.created_at)}</span>
      </div>
    </div>
  );
}
