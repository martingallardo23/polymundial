export function MarketCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-4/5" />
        <div className="h-4 bg-gray-100 rounded w-3/5" />
      </div>
      <div className="space-y-3 mb-3">
        <div>
          <div className="flex justify-between mb-1">
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="h-3 bg-gray-100 rounded w-8" />
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <div className="h-3 bg-gray-100 rounded w-12" />
            <div className="h-3 bg-gray-100 rounded w-8" />
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full" />
        </div>
      </div>
      <div className="flex justify-between border-t border-gray-100 pt-2">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-3 w-24 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MarketCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-24 bg-gray-100 rounded" />
      <div className="space-y-3">
        <div className="h-8 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="h-48 bg-gray-100 rounded-xl" />
    </div>
  );
}
