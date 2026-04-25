import { SkeletonJobCard } from '@/components/ui/Skeleton';

export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-bg-base">
      <div className="bg-bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-4">
          <div className="h-8 w-72 mx-auto rounded animate-pulse bg-bg-elevated" />
          <div className="h-4 w-96 mx-auto rounded animate-pulse bg-bg-elevated" />
          <div className="h-11 max-w-xl mx-auto rounded-lg animate-pulse bg-bg-elevated" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonJobCard key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
