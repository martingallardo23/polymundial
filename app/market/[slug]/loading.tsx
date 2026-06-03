import { DetailSkeleton } from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-6" />
      <DetailSkeleton />
    </div>
  );
}
