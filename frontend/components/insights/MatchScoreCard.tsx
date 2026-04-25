'use client';

import { useState } from 'react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { SkillTag } from '@/components/ui/SkillTag';

interface MatchScoreCardProps {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  job_skills_total: number;
}

const VISIBLE_COUNT = 8;

export function MatchScoreCard({
  match_score,
  matched_skills,
  missing_skills,
  job_skills_total,
}: MatchScoreCardProps) {
  const [showAllMatched, setShowAllMatched] = useState(false);
  const [showAllMissing, setShowAllMissing] = useState(false);

  const visibleMatched = showAllMatched ? matched_skills : matched_skills.slice(0, VISIBLE_COUNT);
  const visibleMissing = showAllMissing ? missing_skills : missing_skills.slice(0, VISIBLE_COUNT);

  const score = Math.round(match_score);

  return (
    <div className="bg-bg-surface border border-border-dim rounded-xl p-8 text-center">
      <div className="flex justify-center">
        <ScoreRing score={score} size={160} />
      </div>
      <p className="text-text-muted text-xs font-mono uppercase tracking-wider mt-3">
        Match Score
      </p>

      {/* Stat chips */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <span
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium"
          style={{ backgroundColor: 'rgb(0 229 160 / 0.1)', color: '#00E5A0' }}
        >
          {matched_skills.length} Matched
        </span>
        <span
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium"
          style={{ backgroundColor: 'rgb(245 166 35 / 0.1)', color: '#F5A623' }}
        >
          {missing_skills.length} Missing
        </span>
        <span
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium"
          style={{ backgroundColor: 'rgb(79 142 247 / 0.1)', color: '#4F8EF7' }}
        >
          {job_skills_total} Total
        </span>
      </div>

      {/* Matched skills */}
      {matched_skills.length > 0 && (
        <div className="mt-6 text-left">
          <p className="text-text-muted text-xs font-mono uppercase tracking-wider mb-3">
            Matched Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {visibleMatched.map((s) => (
              <SkillTag key={s} label={s} variant="matched" />
            ))}
          </div>
          {matched_skills.length > VISIBLE_COUNT && (
            <button
              onClick={() => setShowAllMatched((v) => !v)}
              className="mt-2 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
            >
              {showAllMatched
                ? 'Show less'
                : `Show all ${matched_skills.length - VISIBLE_COUNT} more`}
            </button>
          )}
        </div>
      )}

      {/* Missing skills */}
      {missing_skills.length > 0 && (
        <div className="mt-5 text-left">
          <p className="text-text-muted text-xs font-mono uppercase tracking-wider mb-3">
            Missing Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {visibleMissing.map((s) => (
              <SkillTag key={s} label={s} variant="missing" />
            ))}
          </div>
          {missing_skills.length > VISIBLE_COUNT && (
            <button
              onClick={() => setShowAllMissing((v) => !v)}
              className="mt-2 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
            >
              {showAllMissing
                ? 'Show less'
                : `Show all ${missing_skills.length - VISIBLE_COUNT} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
