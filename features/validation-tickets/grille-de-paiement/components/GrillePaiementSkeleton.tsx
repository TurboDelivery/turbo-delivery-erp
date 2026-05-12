import { Skeleton } from '@/components/ui/skeleton';

export default function GrillePaiementSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
