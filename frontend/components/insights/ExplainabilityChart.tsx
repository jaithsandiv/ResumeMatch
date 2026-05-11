'use client';

import { Network } from 'lucide-react';
import { SkillTag } from '@/components/ui/SkillTag';

interface ExplainabilityEntry {
  job_skill: string;
  candidate_skill: string;
  similarity: number;
}

interface ExplainabilityChartProps {
  explainability: ExplainabilityEntry[];
}

function barColor(similarity: number): string {
  if (similarity >= 0.9) return '#00E5A0';
  if (similarity >= 0.7) return '#4F8EF7';
  return '#F5A623';
}

export function ExplainabilityChart({ explainability }: ExplainabilityChartProps) {
  const sorted = [...explainability].sort((a, b) => b.similarity - a.similarity);

  return (
    <div className="bg-bg-surface border border-border-dim rounded-2xl p-6 shadow-soft">
      <div className="flex items-start gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center shrink-0">
          <Network size={16} className="text-accent-blue" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-text-primary font-semibold text-lg">
            How Skills Were Matched
          </h2>
          <p className="text-text-secondary text-sm font-mono mt-0.5">
            Graph-RAG semantic similarity results
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {sorted.map((entry, i) => {
          const pct = Math.round(entry.similarity * 100);
          const color = barColor(entry.similarity);

          return (
            <div key={i}>
              {/* Skill pair row */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <SkillTag label={entry.job_skill} variant="neutral" />
                <span className="text-text-muted text-xs font-mono">↔</span>
                <SkillTag label={entry.candidate_skill} variant="matched" />
                <span className="ml-auto text-text-primary text-sm font-mono font-semibold shrink-0">
                  {pct}%
                </span>
              </div>

              {/* Similarity bar */}
              <div
                className="h-1.5 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: '#1A1F2C' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                    transition: `width 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${i * 80}ms`,
                    boxShadow: `0 0 8px ${color}66`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
