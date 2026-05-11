import { SkeletonJobCard, Skeleton } from '@/components/ui/Skeleton';

export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-bg-base">
      <div className="bg-bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-4">
          <Skeleton className="h-6 w-40 mx-auto rounded-full" />
          <Skeleton className="h-12 w-80 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
          <Skeleton className="h-12 max-w-xl w-full mx-auto rounded-xl mt-6" />
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
