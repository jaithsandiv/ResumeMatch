import { Skeleton, SkeletonProfileStat } from '@/components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* User card skeleton */}
        <div className="bg-bg-surface border border-border-dim rounded-xl p-6 flex items-center gap-5 mb-6">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonProfileStat key={i} />
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
