import Link from 'next/link';
import type { Market } from '@/lib/types';
import ProbabilityBar from './ProbabilityBar';

const CATEGORY_LABELS: Record<string, string> = {
  champion: 'Campeón',
  match: 'Partido',
  goalscorer: 'Goleador',
  group: 'Grupos',
  other: 'General',
};

const CATEGORY_COLORS: Record<string, string> = {
  champion: 'bg-amber-100 text-amber-800',
  match: 'bg-blue-100 text-blue-800',
  goalscorer: 'bg-purple-100 text-purple-800',
  group: 'bg-emerald-100 text-emerald-800',
  other: 'bg-gray-100 text-gray-600',
};

export function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${Math.round(v)}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  if (d < now) return 'Cerrado';
  return d.toLocaleDateString('es-AR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface Props {
  market: Market;
  livePrices?: Record<string, number>;
  flashingTokens?: Set<string>;
}

export default function MarketCard({ market, livePrices, flashingTokens }: Props) {
  const prices = market.outcomes.map((_, i) => {
    const tokenId = market.parsedTokenIds?.[i];
    if (livePrices && tokenId && livePrices[tokenId] !== undefined) {
      return livePrices[tokenId];
    }
    return parseFloat(market.outcomePrices[i] ?? '0');
  });

  const category = market.category ?? 'other';
  const endDateFormatted = formatDate(market.endDate);
  const isClosed = market.closed || endDateFormatted === 'Cerrado';

  return (
    <Link href={`/market/${market.slug}`} className="group block h-full">
      <article
        className={`bg-white border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-md transition-all duration-200 h-full flex flex-col ${
          isClosed ? 'opacity-60' : ''
        }`}
      >
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span
            className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category]}`}
          >
            {CATEGORY_LABELS[category]}
          </span>
          {isClosed && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              Resuelto
            </span>
          )}
        </div>

        {/* Question */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-3 group-hover:text-emerald-700 transition-colors line-clamp-3 flex-1">
          {market.question}
        </h3>

        {/* Probability bars */}
        <div className="mb-3">
          <ProbabilityBar
            outcomes={market.outcomes}
            prices={prices}
            tokenIds={market.parsedTokenIds}
            flashingTokens={flashingTokens}
            maxRows={2}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2 mt-auto">
          <span>
            Vol:{' '}
            <span className="font-medium text-gray-700">
              {formatVolume(market.volume)}
            </span>
          </span>
          {endDateFormatted && (
            <span className={isClosed ? 'text-red-400' : ''}>
              {endDateFormatted}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
