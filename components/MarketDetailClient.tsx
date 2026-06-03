'use client';

import { useState, useEffect } from 'react';
import type { Market, PriceHistoryPoint, Orderbook } from '@/lib/types';
import { usePricePolling } from '@/lib/hooks';
import ProbabilityBar from './ProbabilityBar';
import PriceChart from './PriceChart';

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${Math.round(v)}`;
}

interface Props {
  market: Market;
}

export default function MarketDetailClient({ market }: Props) {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const tokenIds = market.parsedTokenIds ?? [];
  const { prices, flashing, lastUpdated } = usePricePolling(tokenIds, 10000);

  // Fetch price history for the first (Yes) token
  useEffect(() => {
    const mainToken = tokenIds[0];
    if (!mainToken) {
      setLoadingHistory(false);
      return;
    }
    fetch(`/api/history?tokenId=${encodeURIComponent(mainToken)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHistory(data as PriceHistoryPoint[]);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [tokenIds[0]]);

  // Fetch orderbook
  useEffect(() => {
    const mainToken = tokenIds[0];
    if (!mainToken) return;
    fetch(`/api/price?tokenId=${encodeURIComponent(mainToken)}`)
      .then((r) => r.json())
      .catch(() => {});
  }, [tokenIds[0]]);

  // Build current prices array for outcomes
  const currentPrices = market.outcomes.map((_, i) => {
    const tokenId = market.parsedTokenIds?.[i];
    if (tokenId && prices[tokenId] !== undefined) return prices[tokenId];
    return parseFloat(market.outcomePrices[i] ?? '0');
  });

  const endDate = market.endDate
    ? new Date(market.endDate).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const isBinary =
    market.outcomes.length === 2 &&
    ['Yes', 'No', 'Sí', 'No'].includes(market.outcomes[0]);

  return (
    <div className="space-y-8">
      {/* Stats row */}
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

      {/* Outcomes */}
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
        <h2 className="font-semibold text-gray-900 mb-4">
          Evolución de probabilidad
        </h2>
        {loadingHistory ? (
          <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
        ) : (
          <PriceChart
            data={history}
            outcome={isBinary ? market.outcomes[0] : 'Probabilidad'}
          />
        )}
      </div>

      {/* Polymarket link */}
      <div className="text-center">
        <a
          href={`https://polymarket.com/market/${market.slug}`}
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
