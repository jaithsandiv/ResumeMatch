'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ChevronLeft } from 'lucide-react';
import { MatchScoreCard } from '@/components/insights/MatchScoreCard';
import { ExplainabilityChart } from '@/components/insights/ExplainabilityChart';
import { CounterfactualPanel } from '@/components/insights/CounterfactualPanel';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';
import { SkeletonInsightCard } from '@/components/ui/Skeleton';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GraphMatchResult {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  explainability: Array<{
    job_skill: string;
    candidate_skill: string;
    similarity: number;
  }>;
  job_id: string;
  resume_id: string;
}

interface CounterfactualResult {
  baseline_score: number;
  counterfactuals: Array<{
    skill: string;
    score_delta: number;
    new_match_score: number;
    improvement_action: string;
  }>;
}

interface CachedAnalysis {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  explainability: GraphMatchResult['explainability'];
  baseline_score: number | null;
  counterfactuals: CounterfactualResult['counterfactuals'] | null;
}

// ─── Step tracker ────────────────────────────────────────────────────────────

type StepId = 0 | 1 | 2 | 3;

const STEPS = [
  { label: 'Extract Skills' },
  { label: 'Graph Match' },
  { label: 'Counterfactual' },
  { label: 'Done' },
];

interface StepTrackerProps {
  current: StepId;
  error: boolean;
}

function StepTracker({ current, error }: StepTrackerProps) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  backgroundColor: done || active
                    ? (error && active ? 'rgb(240 96 96 / 0.15)' : 'rgb(0 229 160 / 0.15)')
                    : '#1C2030',
                  border: `2px solid ${
                    done || active
                      ? error && active
                        ? '#F06060'
                        : '#00E5A0'
                      : '#252A3A'
                  }`,
                }}
              >
                {done ? (
                  <CheckCircle2 size={14} color="#00E5A0" strokeWidth={2.5} />
                ) : active && !error && current < 3 ? (
                  <Loader2 size={13} color="#00E5A0" className="animate-spin" />
                ) : (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: active ? (error ? '#F06060' : '#00E5A0') : '#525970' }}
                  />
                )}
              </div>
              <span
                className="text-xs font-mono whitespace-nowrap"
                style={{
                  color: active
                    ? error
                      ? '#F06060'
                      : '#00E5A0'
                    : done
                    ? '#00E5A0'
                    : '#525970',
                  fontWeight: active ? 700 : 400,
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className="flex-1 h-px mx-2 transition-all duration-500"
                style={{ backgroundColor: done ? '#00E5A0' : '#252A3A', marginBottom: '18px' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Result panels ───────────────────────────────────────────────────────────

function ResultPanels({
  graphMatch,
  counterfactual,
}: {
  graphMatch: GraphMatchResult;
  counterfactual: CounterfactualResult;
}) {
  const jobSkillsTotal = graphMatch.matched_skills.length + graphMatch.missing_skills.length;
  return (
    <div className="flex flex-col gap-6" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <MatchScoreCard
        match_score={graphMatch.match_score}
        matched_skills={graphMatch.matched_skills}
        missing_skills={graphMatch.missing_skills}
        job_skills_total={jobSkillsTotal}
      />
      {graphMatch.explainability.length > 0 && (
        <ExplainabilityChart explainability={graphMatch.explainability} />
      )}
      {counterfactual.counterfactuals.length > 0 && (
        <CounterfactualPanel
          counterfactuals={counterfactual.counterfactuals}
          baseline_score={counterfactual.baseline_score}
        />
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const jobId = searchParams.get('job_id') ?? '';
  const resumeId = searchParams.get('resume_id') ?? '';

  // Cached / live results
  const [graphMatch, setGraphMatch] = useState<GraphMatchResult | null>(null);
  const [counterfactual, setCounterfactual] = useState<CounterfactualResult | null>(null);
  const [complete, setComplete] = useState(false);

  // Live pipeline state (only shown when cache miss)
  const [loadingCache, setLoadingCache] = useState(true);
  const [step, setStep] = useState<StepId>(0);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryFrom, setRetryFrom] = useState<StepId>(0);

  // ── Apply cached analysis to state ────────────────────────────────────────
  function applyCache(data: CachedAnalysis) {
    setGraphMatch({
      match_score: data.match_score,
      matched_skills: data.matched_skills,
      missing_skills: data.missing_skills,
      explainability: data.explainability,
      job_id: jobId,
      resume_id: resumeId,
    });
    setCounterfactual({
      baseline_score: data.baseline_score ?? data.match_score,
      counterfactuals: data.counterfactuals ?? [],
    });
    setComplete(true);
  }

  // ── Live pipeline (cache miss path) ───────────────────────────────────────
  const runAnalysis = useCallback(
    async (fromStep: StepId) => {
      setErrorMsg(null);
      setComplete(false);
      setRunningPipeline(true);

      try {
        // Step 0 — skill extraction
        if (fromStep <= 0) {
          setStep(0);
          try {
            await api.post('/ai/skill-extraction', { resume_id: resumeId });
          } catch (err: unknown) {
            const s = (err as { response?: { status?: number } })?.response?.status;
            if (s !== 400) throw err; // 400 = "already extracted", continue
          }
        }

        // Step 1 — graph match
        if (fromStep <= 1) {
          setStep(1);
          const res = await api.post<GraphMatchResult>('/ai/graph-match', {
            job_id: jobId,
            resume_id: resumeId,
          });
          setGraphMatch(res.data);
        }

        // Step 2 — counterfactual
        if (fromStep <= 2) {
          setStep(2);
          const res = await api.post<CounterfactualResult>('/ai/counterfactual-analysis', {
            job_id: jobId,
            resume_id: resumeId,
          });
          setCounterfactual(res.data);
        }

        setStep(3);
        setComplete(true);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string; message?: string } } })?.response
            ?.data?.detail ??
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (err as Error)?.message ??
          'Unknown error';
        setErrorMsg(msg);
        handleApiError(err, toast, { fallback: msg });
      } finally {
        setRunningPipeline(false);
      }
    },
    [jobId, resumeId, toast]
  );

  // ── On mount: try cache, fall back to live pipeline ───────────────────────
  useEffect(() => {
    if (!jobId || !resumeId) return;

    api
      .get<CachedAnalysis>(`/ai/analysis/${jobId}/${resumeId}`)
      .then(({ data }) => {
        // Cache hit — only skip the pipeline if we have both match and counterfactual
        if (data.match_score != null && data.counterfactuals != null) {
          applyCache(data);
          setLoadingCache(false);
        } else {
          setLoadingCache(false);
          runAnalysis(0);
        }
      })
      .catch(() => {
        // 404 or error — run the live pipeline
        setLoadingCache(false);
        runAnalysis(0);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRetry() {
    runAnalysis(retryFrom);
  }

  useEffect(() => {
    if (errorMsg !== null) setRetryFrom(step);
  }, [errorMsg, step]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-accent-blue text-sm hover:underline mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <h1
            className="text-text-primary font-semibold text-2xl"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Skill Gap Insights
          </h1>
          <p className="text-text-secondary text-sm font-mono mt-1">
            AI-powered analysis of your resume vs this role
          </p>
        </div>

        {/* Loading cache check */}
        {loadingCache && (
          <div className="flex items-center gap-2 text-text-secondary text-sm font-mono mb-8">
            <Loader2 size={14} className="animate-spin text-accent-green" />
            <span>Loading analysis…</span>
          </div>
        )}

        {/* Live pipeline UI (only shown when running the pipeline, not on cache hit) */}
        {!loadingCache && runningPipeline && (
          <>
            <StepTracker current={step} error={errorMsg !== null} />
            {!complete && !errorMsg && (
              <div className="flex items-center gap-2 text-text-secondary text-sm font-mono mb-8">
                <Loader2 size={14} className="animate-spin text-accent-green" />
                <span>Running {STEPS[step]?.label}…</span>
              </div>
            )}
          </>
        )}

        {/* Error banner */}
        {errorMsg && (
          <div
            className="flex items-center justify-between gap-4 rounded-lg px-4 py-3 mb-8 border"
            style={{
              backgroundColor: 'rgb(240 96 96 / 0.08)',
              borderColor: 'rgb(240 96 96 / 0.3)',
            }}
          >
            <span className="text-[#F06060] text-sm font-mono">
              Analysis failed: {errorMsg}
            </span>
            <button
              onClick={handleRetry}
              className="shrink-0 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors"
              style={{
                backgroundColor: 'rgb(240 96 96 / 0.15)',
                color: '#F06060',
                border: '1px solid rgb(240 96 96 / 0.3)',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Skeleton while pipeline running but no results yet */}
        {runningPipeline && !complete && !errorMsg && (
          <div className="flex flex-col gap-6">
            <SkeletonInsightCard />
            <SkeletonInsightCard />
          </div>
        )}

        {/* Results */}
        {complete && graphMatch && counterfactual && (
          <ResultPanels graphMatch={graphMatch} counterfactual={counterfactual} />
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
