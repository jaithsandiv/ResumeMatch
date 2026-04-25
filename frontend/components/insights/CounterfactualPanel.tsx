'use client';

import { SkillTag } from '@/components/ui/SkillTag';

interface Counterfactual {
  skill: string;
  score_delta: number;
  new_match_score: number;
  improvement_action: string;
}

interface CounterfactualPanelProps {
  counterfactuals: Counterfactual[];
  baseline_score: number;
}

export function CounterfactualPanel({ counterfactuals, baseline_score }: CounterfactualPanelProps) {
  const topItems = counterfactuals.slice(0, 5);

  return (
    <div className="bg-bg-surface border border-border-dim rounded-xl p-6">
      <h2 className="text-text-primary font-semibold text-lg" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        Skill Improvement Roadmap
      </h2>
      <p className="text-text-secondary text-sm font-mono mt-1">
        Ranked by impact on your match score
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {topItems.map((item, i) => {
          const baselinePct = Math.min(baseline_score, 100);
          const deltaPct = Math.min(item.score_delta, 100 - baselinePct);

          return (
            <div
              key={i}
              className="border border-border-dim rounded-lg p-5 transition-colors"
              style={{ backgroundColor: '#141720' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor = '#353B52')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor = '#252A3A')
              }
            >
              {/* Top row: rank + skill + delta badge */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted font-mono text-xs">#{i + 1}</span>
                  <SkillTag label={item.skill} variant="missing" />
                </div>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono font-bold text-sm border"
                  style={{
                    backgroundColor: 'rgb(0 229 160 / 0.1)',
                    borderColor: 'rgb(0 229 160 / 0.2)',
                    color: '#00E5A0',
                  }}
                >
                  +{item.score_delta}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div
                  className="h-2 w-full rounded-full flex overflow-hidden"
                  style={{ backgroundColor: '#1C2030' }}
                >
                  <div
                    className="h-full rounded-l-full"
                    style={{
                      width: `${baselinePct}%`,
                      backgroundColor: 'rgb(79 142 247 / 0.3)',
                      transition: `width 0.6s ease-out ${i * 80}ms`,
                    }}
                  />
                  <div
                    className="h-full"
                    style={{
                      width: `${deltaPct}%`,
                      backgroundColor: '#00E5A0',
                      transition: `width 0.6s ease-out ${i * 80 + 200}ms`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="font-mono text-xs text-text-muted">
                    Current: {baseline_score}%
                  </span>
                  <span className="font-mono text-xs text-text-muted">
                    After: {item.new_match_score}%
                  </span>
                </div>
              </div>

              {/* Improvement action */}
              <p
                className="mt-3 pl-3 text-sm italic text-text-secondary"
                style={{ borderLeft: '2px solid #F5A623' }}
              >
                {item.improvement_action}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
