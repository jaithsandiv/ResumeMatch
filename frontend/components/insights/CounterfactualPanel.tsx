'use client';

import { TrendingUp, Lightbulb } from 'lucide-react';
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

export function CounterfactualPanel({
  counterfactuals,
  baseline_score,
}: CounterfactualPanelProps) {
  const topItems = counterfactuals.slice(0, 5);

  return (
    <div className="bg-bg-surface border border-border-dim rounded-2xl p-6 shadow-soft">
      <div className="flex items-start gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-accent-green/10 border border-accent-green/30 flex items-center justify-center shrink-0">
          <TrendingUp size={16} className="text-accent-green" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-text-primary font-semibold text-lg">
            Skill Improvement Roadmap
          </h2>
          <p className="text-text-secondary text-sm font-mono mt-0.5">
            Ranked by impact on your match score
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {topItems.map((item, i) => {
          const baselinePct = Math.min(baseline_score, 100);
          const deltaPct = Math.min(item.score_delta, 100 - baselinePct);

          return (
            <div
              key={i}
              className="bg-bg-elevated border border-border-dim rounded-xl p-5 hover:border-border-bright transition-colors"
            >
              {/* Top row: rank + skill + delta badge */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-bg-surface border border-border-dim text-text-muted font-mono text-xs font-semibold">
                    {i + 1}
                  </span>
                  <SkillTag label={item.skill} variant="missing" />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-bold text-sm border bg-accent-green/10 border-accent-green/30 text-accent-green">
                  +{item.score_delta}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div
                  className="h-2 w-full rounded-full flex overflow-hidden"
                  style={{ backgroundColor: '#0A0C10' }}
                >
                  <div
                    className="h-full rounded-l-full"
                    style={{
                      width: `${baselinePct}%`,
                      backgroundColor: 'rgba(79, 142, 247, 0.4)',
                      transition: `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 80}ms`,
                    }}
                  />
                  <div
                    className="h-full"
                    style={{
                      width: `${deltaPct}%`,
                      backgroundColor: '#00E5A0',
                      transition: `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 80 + 200}ms`,
                      boxShadow: '0 0 8px rgba(0, 229, 160, 0.5)',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-mono text-xs text-text-muted">
                    Current: <span className="text-text-secondary">{baseline_score}%</span>
                  </span>
                  <span className="font-mono text-xs text-text-muted">
                    After: <span className="text-accent-green">{item.new_match_score}%</span>
                  </span>
                </div>
              </div>

              {/* Improvement action */}
              <div className="mt-4 flex items-start gap-2 pl-3 border-l-2 border-accent-amber">
                <Lightbulb
                  size={14}
                  className="text-accent-amber shrink-0 mt-0.5"
                />
                <p className="text-sm text-text-secondary leading-relaxed">
                  {item.improvement_action}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
