'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Market, PriceHistoryPoint } from '@/lib/types';
import { usePricePolling } from '@/lib/hooks';
import ProbabilityBar from './ProbabilityBar';
import PriceChart, { type PriceSeries } from './PriceChart';

const CHART_OUTCOMES = 5;

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${Math.round(v)}`;
}

interface Props {
  market: Market;
}

export default function MarketDetailClient({ market }: Props) {
  const [series, setSeries] = useState<PriceSeries[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const isMultiOutcome = market.outcomes.length > 2;
  const tokenIds = market.parsedTokenIds ?? [];
  const { prices, flashing, lastUpdated } = usePricePolling(tokenIds, 10000);

  // Current prices: live if available, else from API response
  const currentPrices = market.outcomes.map((_, i) => {
    const tid = market.parsedTokenIds?.[i];
    return tid && prices[tid] !== undefined
      ? prices[tid]
      : parseFloat(market.outcomePrices[i] ?? '0');
  });

  // Pick which outcomes to chart — stable (based on initial API prices, not live)
  const chartTargets = useMemo(() => {
    const rows = market.outcomes.map((outcome, i) => ({
      outcome,
      tokenId: market.parsedTokenIds?.[i] ?? '',
      price: parseFloat(market.outcomePrices[i] ?? '0'),
    }));

    if (!isMultiOutcome) {
      // Binary: just show the Yes/first outcome
      return rows.slice(0, 1).filter((r) => r.tokenId);
    }

    // Multi: top N by current probability
    return rows
      .filter((r) => r.tokenId)
      .sort((a, b) => b.price - a.price)
      .slice(0, CHART_OUTCOMES);
  // market props are stable (server-rendered, never mutate)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market.id]);

  useEffect(() => {
    if (!chartTargets.length) {
      setLoadingHistory(false);
      return;
    }
    setLoadingHistory(true);

    Promise.allSettled(
      chartTargets.map(({ tokenId }) =>
        fetch(`/api/history?tokenId=${encodeURIComponent(tokenId)}`)
          .then((r) => (r.ok ? r.json() : []))
          .then((d) => (Array.isArray(d) ? (d as PriceHistoryPoint[]) : [])),
      ),
    )
      .then((results) => {
        setSeries(
          chartTargets.map(({ outcome }, i) => ({
            outcome,
            data:
              results[i].status === 'fulfilled' ? results[i].value : [],
          })),
        );
      })
      .finally(() => setLoadingHistory(false));
  }, [chartTargets]);

  const endDate = market.endDate
    ? new Date(market.endDate).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Show "Otros" line when we're not displaying all outcomes
  const showOthers =
    isMultiOutcome && chartTargets.length < market.outcomes.length;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-0.5">Volumen total</p>
          <p className="text-xl font-bold text-gray-900">
            {formatVolume(market.volume)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-0.5">Liquidez</p>
          <p className="text-xl font-bold text-gray-900">
            {formatVolume(market.liquidity)}
          </p>
        </div>
        {endDate && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-gray-500 mb-0.5">Cierre</p>
            <p className="text-sm font-semibold text-gray-900">{endDate}</p>
          </div>
        )}
      </div>

      {/* Probabilities */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Probabilidades</h2>
          {lastUpdated && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs text-gray-400">En vivo</span>
            </div>
          )}
        </div>
        <ProbabilityBar
          outcomes={market.outcomes}
          prices={currentPrices}
          tokenIds={market.parsedTokenIds}
          flashingTokens={flashing}
          maxRows={market.outcomes.length}
        />
      </div>

      {/* Price chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            Evolución de probabilidad
          </h2>
          {isMultiOutcome && (
            <span className="text-xs text-gray-400">
              Top {chartTargets.length}
              {showOthers ? ' + Otros' : ''}
            </span>
          )}
        </div>
        {loadingHistory ? (
          <div className="h-56 bg-gray-50 rounded-lg animate-pulse" />
        ) : (
          <PriceChart series={series} withOthers={showOthers} />
        )}
      </div>

      {/* Polymarket link */}
      <div className="text-center">
        <a
          href={`https://polymarket.com/${market.isEvent ? 'event' : 'market'}/${market.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Ver en Polymarket
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
