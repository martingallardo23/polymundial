interface OutcomeRow {
  outcome: string;
  price: number;
  tokenId?: string;
  flashing?: boolean;
}

interface Props {
  outcomes: string[];
  prices: number[];
  tokenIds?: string[];
  flashingTokens?: Set<string>;
  maxRows?: number;
}

export default function ProbabilityBar({
  outcomes,
  prices,
  tokenIds,
  flashingTokens,
  maxRows = 2,
}: Props) {
  if (!outcomes.length || !prices.length) return null;

  const rows: OutcomeRow[] = outcomes
    .map((outcome, i) => ({
      outcome,
      price: prices[i] ?? 0,
      tokenId: tokenIds?.[i],
      flashing: tokenIds?.[i] ? flashingTokens?.has(tokenIds[i]) : false,
    }))
    .sort((a, b) => b.price - a.price)
    .slice(0, maxRows);

  return (
    <div className="space-y-2">
      {rows.map(({ outcome, price, flashing }) => (
        <div
          key={outcome}
          className={`rounded-md px-2 py-1 transition-colors duration-300 ${
            flashing ? 'bg-emerald-50' : ''
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600 truncate max-w-[72%]">
              {outcome}
            </span>
            <span
              className={`text-xs font-semibold tabular-nums transition-colors duration-300 ${
                flashing ? 'text-emerald-600' : 'text-gray-900'
              }`}
            >
              {(price * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(price * 100, 0.5)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
