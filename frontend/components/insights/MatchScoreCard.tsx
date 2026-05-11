'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, Layers } from 'lucide-react';
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
    <div className="relative bg-bg-surface border border-border-dim rounded-2xl p-8 text-center overflow-hidden shadow-soft">
      <div className="flex justify-center">
        <ScoreRing score={score} size={172} />
      </div>
      <p className="text-text-muted text-xs font-mono uppercase tracking-wider mt-4">
        Match Score
      </p>

      {/* Stat chips */}
      <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-accent-green/10 border border-accent-green/30 text-accent-green">
          <CheckCircle2 size={11} />
          {matched_skills.length} Matched
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-accent-amber/10 border border-accent-amber/30 text-accent-amber">
          <AlertCircle size={11} />
          {missing_skills.length} Missing
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-accent-blue/10 border border-accent-blue/30 text-accent-blue">
          <Layers size={11} />
          {job_skills_total} Total
        </span>
      </div>

      {/* Matched skills */}
      {matched_skills.length > 0 && (
        <div className="mt-7 text-left">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={13} className="text-accent-green" />
            <p className="text-text-secondary text-xs font-mono uppercase tracking-wider">
              Matched Skills
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleMatched.map((s) => (
              <SkillTag key={s} label={s} variant="matched" />
            ))}
          </div>
          {matched_skills.length > VISIBLE_COUNT && (
            <button
              onClick={() => setShowAllMatched((v) => !v)}
              className="mt-3 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
            >
              {showAllMatched
                ? '— Show less'
                : `+ Show all ${matched_skills.length - VISIBLE_COUNT} more`}
            </button>
          )}
        </div>
      )}

      {/* Missing skills */}
      {missing_skills.length > 0 && (
        <div className="mt-6 text-left">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={13} className="text-accent-amber" />
            <p className="text-text-secondary text-xs font-mono uppercase tracking-wider">
              Missing Skills
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleMissing.map((s) => (
              <SkillTag key={s} label={s} variant="missing" />
            ))}
          </div>
          {missing_skills.length > VISIBLE_COUNT && (
            <button
              onClick={() => setShowAllMissing((v) => !v)}
              className="mt-3 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
            >
              {showAllMissing
                ? '— Show less'
                : `+ Show all ${missing_skills.length - VISIBLE_COUNT} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
