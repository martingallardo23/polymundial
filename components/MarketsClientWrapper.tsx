'use client';

import { useState, useMemo } from 'react';
import type { Market, MarketFilters } from '@/lib/types';
import { usePricePolling } from '@/lib/hooks';
import MarketCard from './MarketCard';
import Filters from './Filters';

const DEFAULT_FILTERS: MarketFilters = {
  category: 'all',
  status: 'active',
  search: '',
  sort: 'volume',
};

function applyFilters(markets: Market[], filters: MarketFilters): Market[] {
  let list = [...markets];

  if (filters.category !== 'all') {
    list = list.filter((m) => m.category === filters.category);
  }

  if (filters.status === 'active') {
    list = list.filter((m) => m.active && !m.closed);
  } else if (filters.status === 'closed') {
    list = list.filter((m) => m.closed || !m.active);
  }

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    list = list.filter((m) => m.question.toLowerCase().includes(q));
  }

  if (filters.sort === 'volume') {
    list.sort((a, b) => b.volume - a.volume);
  } else {
    list.sort(
      (a, b) =>
        new Date(a.endDate || '9999').getTime() -
        new Date(b.endDate || '9999').getTime(),
    );
  }

  return list;
}

interface Props {
  markets: Market[];
}

export default function MarketsClientWrapper({ markets }: Props) {
  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_FILTERS);

  const filteredMarkets = useMemo(
    () => applyFilters(markets, filters),
    [markets, filters],
  );

  // Collect all unique tokenIds for polling
  const tokenIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of filteredMarkets.slice(0, 30)) {
      m.parsedTokenIds?.forEach((id) => ids.add(id));
    }
    return Array.from(ids);
  }, [filteredMarkets]);

  const { prices, flashing, lastUpdated } = usePricePolling(tokenIds, 15000);

  return (
    <div>
      {/* Filters */}
      <div className="mb-6">
        <Filters
          filters={filters}
          onChange={setFilters}
          total={filteredMarkets.length}
        />
      </div>

      {/* Live indicator */}
      {lastUpdated && (
        <div className="flex items-center gap-1.5 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-gray-400">
            Actualizado {lastUpdated.toLocaleTimeString('es-AR', { timeStyle: 'medium' })}
          </span>
        </div>
      )}

      {/* Grid */}
      {filteredMarkets.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">⚽</div>
          <p className="text-lg font-medium text-gray-500 mb-1">
            Sin mercados activos
          </p>
          <p className="text-sm">
            {filters.search
              ? 'Probá con otra búsqueda'
              : 'No hay mercados del Mundial disponibles en este momento'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMarkets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              livePrices={prices}
              flashingTokens={flashing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
