import type { Market } from '@/lib/types';
import MarketCard from './MarketCard';

interface Props {
  title: string;
  icon: string;
  markets: Market[];
  livePrices?: Record<string, number>;
  flashingTokens?: Set<string>;
}

export default function MarketSection({
  title,
  icon,
  markets,
  livePrices,
  flashingTokens,
}: Props) {
  if (!markets.length) return null;

  return (
    <section className="mb-10">
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xl leading-none">{icon}</span>
        <h2 className="text-base font-bold text-gray-800 tracking-tight">{title}</h2>
        <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          {markets.length}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map((market) => (
          <MarketCard
            key={market.id}
            market={market}
            livePrices={livePrices}
            flashingTokens={flashingTokens}
          />
        ))}
      </div>
    </section>
  );
}
