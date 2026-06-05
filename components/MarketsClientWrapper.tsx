'use client';

import { useState, useMemo } from 'react';
import type { Market, MarketFilters } from '@/lib/types';
import { usePricePolling } from '@/lib/hooks';
import MarketCard from './MarketCard';
import ChampionHero from './ChampionHero';
import MarketSection from './MarketSection';
import Filters from './Filters';

const DEFAULT_FILTERS: MarketFilters = {
  category: 'all',
  status: 'active',
  search: '',
  sort: 'volume',
};

function applyFilters(markets: Market[], filters: MarketFilters): Market[] {
  let list = [...markets];

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

  const filtered = useMemo(() => applyFilters(markets, filters), [markets, filters]);

  // Group by category (champion is always separated as hero)
  const champion = useMemo(
    () => filtered.find((m) => m.category === 'champion'),
    [filtered],
  );
  const nonChampion = useMemo(
    () => filtered.filter((m) => m.category !== 'champion'),
    [filtered],
  );
  const matches = useMemo(
    () => nonChampion.filter((m) => m.category === 'match'),
    [nonChampion],
  );
  const groups = useMemo(
    () => nonChampion.filter((m) => m.category === 'group'),
    [nonChampion],
  );
  const goalscorers = useMemo(
    () => nonChampion.filter((m) => m.category === 'goalscorer'),
    [nonChampion],
  );
  const others = useMemo(
    () => nonChampion.filter((m) => m.category === 'other'),
    [nonChampion],
  );

  const isSearching = filters.search.trim().length > 0;

  // Collect token IDs for live polling — champion tokens first, then up to 40 more
  const tokenIds = useMemo(() => {
    const ids = new Set<string>();
    champion?.parsedTokenIds?.forEach((id) => ids.add(id));
    for (const m of nonChampion.slice(0, 40)) {
      m.parsedTokenIds?.forEach((id) => ids.add(id));
    }
    return Array.from(ids);
  }, [champion, nonChampion]);

  const { prices, flashing, lastUpdated } = usePricePolling(tokenIds, 15000);

  const total = filtered.length;

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-8">
        <Filters filters={filters} onChange={setFilters} total={total} />
      </div>

      {total === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">⚽</div>
          <p className="text-lg font-semibold text-gray-500 mb-1">
            Sin resultados
          </p>
          <p className="text-sm text-gray-400">
            {filters.search
              ? 'Probá con otra búsqueda'
              : 'No hay mercados del Mundial disponibles en este momento'}
          </p>
        </div>
      ) : isSearching ? (
        /* ── Flat search results ── */
        <>
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>
              {total} resultado{total !== 1 ? 's' : ''} para{' '}
              <strong className="text-gray-700">"{filters.search}"</strong>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                livePrices={prices}
                flashingTokens={flashing}
              />
            ))}
          </div>
        </>
      ) : (
        /* ── Sectioned layout ── */
        <>
          {/* Live indicator */}
          {lastUpdated && (
            <div className="flex items-center gap-1.5 mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs text-gray-400">
                Actualizado{' '}
                {lastUpdated.toLocaleTimeString('es-AR', { timeStyle: 'medium' })}
              </span>
            </div>
          )}

          {/* Champion hero */}
          {champion && (
            <ChampionHero
              market={champion}
              livePrices={prices}
              flashingTokens={flashing}
              lastUpdated={lastUpdated}
            />
          )}

          {/* Sections */}
          <MarketSection
            title="Partidos"
            icon="⚽"
            markets={matches}
            livePrices={prices}
            flashingTokens={flashing}
          />
          <MarketSection
            title="Grupos"
            icon="📊"
            markets={groups}
            livePrices={prices}
            flashingTokens={flashing}
          />
          <MarketSection
            title="Goleadores"
            icon="👟"
            markets={goalscorers}
            livePrices={prices}
            flashingTokens={flashing}
          />
          <MarketSection
            title="General"
            icon="🔮"
            markets={others}
            livePrices={prices}
            flashingTokens={flashing}
          />

          {/* No champion but all other sections also empty */}
          {!champion && !matches.length && !groups.length &&
            !goalscorers.length && !others.length && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">⚽</div>
              <p className="text-sm">No hay mercados que mostrar con este filtro</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
