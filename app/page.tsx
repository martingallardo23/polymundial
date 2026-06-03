import { getWorldCupMarkets } from '@/lib/polymarket';
import MarketsClientWrapper from '@/components/MarketsClientWrapper';
import { GridSkeleton } from '@/components/LoadingSkeleton';
import { Suspense } from 'react';

export const revalidate = 60;

async function MarketsSection() {
  let markets = await getWorldCupMarkets().catch(() => []);

  return <MarketsClientWrapper markets={markets} />;
}

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl" role="img" aria-label="soccer ball">⚽</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Polymundial
          </h1>
        </div>
        <p className="text-gray-500 text-sm sm:text-base">
          Mercados de predicción para la{' '}
          <span className="font-medium text-gray-700">
            FIFA World Cup 2026
          </span>{' '}
          — probabilidades en tiempo real vía Polymarket
        </p>
      </header>

      {/* Markets */}
      <Suspense fallback={<GridSkeleton count={9} />}>
        <MarketsSection />
      </Suspense>
    </div>
  );
}
