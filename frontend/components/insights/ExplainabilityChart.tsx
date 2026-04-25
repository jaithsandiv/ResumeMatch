'use client';

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
    <div className="bg-bg-surface border border-border-dim rounded-xl p-6">
      <h2 className="text-text-primary font-semibold text-lg" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        How Skills Were Matched
      </h2>
      <p className="text-text-secondary text-sm font-mono mt-1">
        Graph-RAG semantic similarity results
      </p>

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
                <span className="ml-auto text-text-secondary text-sm font-mono shrink-0">
                  {pct}%
                </span>
              </div>

              {/* Similarity bar */}
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: '#1C2030' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                    transition: `width 0.8s ease-out ${i * 100}ms`,
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
