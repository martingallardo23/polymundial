'use client';

import Link from 'next/link';
import type { Market } from '@/lib/types';
import { formatVolume } from './MarketCard';

const TOP_N = 8;

interface Props {
  market: Market;
  livePrices?: Record<string, number>;
  flashingTokens?: Set<string>;
  lastUpdated?: Date | null;
}

export default function ChampionHero({
  market,
  livePrices,
  flashingTokens,
  lastUpdated,
}: Props) {
  const prices = market.outcomes.map((_, i) => {
    const tid = market.parsedTokenIds?.[i];
    return tid && livePrices?.[tid] !== undefined
      ? livePrices[tid]
      : parseFloat(market.outcomePrices[i] ?? '0');
  });

  const sorted = market.outcomes
    .map((outcome, i) => ({
      outcome,
      price: prices[i] ?? 0,
      tokenId: market.parsedTokenIds?.[i],
    }))
    .sort((a, b) => b.price - a.price);

  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  const othersSum = rest.reduce((s, o) => s + o.price, 0);
  const maxPrice = top[0]?.price ?? 0.01;

  const href = `/market/${market.slug}`;

  return (
    <div className="relative overflow-hidden rounded-2xl mb-10 shadow-xl">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900" />
      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      {/* Top highlight line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

      <div className="relative px-6 py-7 sm:px-8 sm:py-8">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            {lastUpdated && (
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-medium text-emerald-400 tracking-wide uppercase">
                  En vivo
                </span>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              🏆 ¿Quién gana el Mundial 2026?
            </h2>
          </div>

          <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Volumen
            </span>
            <span className="text-2xl font-bold text-emerald-400">
              {formatVolume(market.volume)}
            </span>
          </div>
        </div>

        {/* Outcomes grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-1 mb-6">
          {top.map(({ outcome, price, tokenId }, i) => {
            const pct = price * 100;
            const barPct = (price / maxPrice) * 100;
            const flashing = !!(tokenId && flashingTokens?.has(tokenId));
            const isTop3 = i < 3;

            return (
              <div
                key={outcome}
                className={`py-2 px-2 -mx-2 rounded-lg transition-colors duration-300 ${
                  flashing ? 'bg-white/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  {/* Rank */}
                  <span
                    className={`w-5 text-center text-xs font-bold tabular-nums ${
                      i === 0
                        ? 'text-amber-400'
                        : isTop3
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                  {/* Name */}
                  <span className="flex-1 text-sm font-semibold text-white truncate">
                    {outcome}
                  </span>
                  {/* Percentage */}
                  <span
                    className={`text-sm font-bold tabular-nums transition-colors duration-300 ${
                      flashing
                        ? 'text-emerald-300'
                        : isTop3
                          ? 'text-emerald-300'
                          : 'text-slate-300'
                    }`}
                  >
                    {pct.toFixed(1)}%
                  </span>
                </div>
                {/* Bar */}
                <div className="ml-8 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      i === 0
                        ? 'bg-amber-400'
                        : i < 3
                          ? 'bg-emerald-400'
                          : 'bg-emerald-600'
                    }`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Others row */}
        {othersSum > 0.005 && (
          <div className="flex items-center justify-between border-t border-white/10 pt-3 mb-5 px-2">
            <span className="text-xs text-slate-500 italic">
              + {rest.length} equipo{rest.length !== 1 ? 's' : ''} restante
              {rest.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs font-medium text-slate-400 tabular-nums">
              {(othersSum * 100).toFixed(1)}%
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 sm:hidden">
            Vol: {formatVolume(market.volume)}
          </span>
          <Link
            href={href}
            className="ml-auto group inline-flex items-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-300 hover:text-emerald-200 text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200"
          >
            Ver evolución completa
            <svg
              className="h-4 w-4 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
