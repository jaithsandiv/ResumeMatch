const BASE = 'animate-pulse bg-bg-elevated rounded';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`${BASE} ${className}`} />;
}

export function SkeletonJobCard() {
  return (
    <div className="bg-bg-surface border border-border-dim rounded-lg p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

export function SkeletonProfileStat() {
  return (
    <div className="bg-bg-surface border border-border-dim rounded-lg p-4 flex flex-col items-center gap-2">
      <Skeleton className="h-7 w-12" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function SkeletonInsightCard() {
  return (
    <div className="bg-bg-surface border border-border-dim rounded-xl p-8 space-y-5">
      <div className="flex justify-center">
        <Skeleton className="w-40 h-40 rounded-full" />
      </div>
      <div className="flex justify-center gap-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
