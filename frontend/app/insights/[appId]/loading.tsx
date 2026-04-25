import { SkeletonInsightCard } from '@/components/ui/Skeleton';

export default function InsightsLoading() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 space-y-2">
          <div className="h-7 w-56 rounded animate-pulse bg-bg-elevated" />
          <div className="h-4 w-72 rounded animate-pulse bg-bg-elevated" />
        </div>
        <SkeletonInsightCard />
      </div>
    </div>
  );
}
