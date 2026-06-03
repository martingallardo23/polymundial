import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMarketBySlug } from '@/lib/polymarket';
import MarketDetailClient from '@/components/MarketDetailClient';

export const revalidate = 30;

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

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const market = await getMarketBySlug(slug).catch(() => null);
  if (!market) return { title: 'Mercado no encontrado — Polymundial' };
  return {
    title: `${market.question} — Polymundial`,
    description: market.description ?? `Probabilidades para: ${market.question}`,
  };
}

export default async function MarketDetailPage({ params }: Props) {
  const { slug } = await params;
  const market = await getMarketBySlug(slug).catch(() => null);

  if (!market) notFound();

  const category = market.category ?? 'other';
  const isOpen = market.active && !market.closed;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors"
      >
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Todos los mercados
      </Link>

      {/* Title section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category]}`}
          >
            {CATEGORY_LABELS[category]}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isOpen
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {isOpen ? 'Activo' : 'Cerrado'}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-2">
          {market.question}
        </h1>

        {market.description && (
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            {market.description}
          </p>
        )}
      </div>

      {/* Dynamic client section (prices, chart, orderbook) */}
      <MarketDetailClient market={market} />
    </div>
  );
}
