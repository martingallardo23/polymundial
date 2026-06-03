import type { Market, Tag, PriceHistoryPoint, Orderbook } from './types';
import type { MarketCategory } from './types';

const GAMMA_BASE = 'https://gamma-api.polymarket.com';
const CLOB_BASE = 'https://clob.polymarket.com';

function parseJsonField<T>(value: T | string | undefined): T | undefined {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }
  return value as T | undefined;
}

function detectCategory(question: string): MarketCategory {
  const q = question.toLowerCase();
  if (/champion|win (the |)world cup|world cup winner|lift (the |)trophy|campeon/i.test(q))
    return 'champion';
  if (/golden boot|top scorer|most goals|goal scorer|goleador/i.test(q))
    return 'goalscorer';
  if (/advance|qualify|group [a-h]|round of|knockout|qualify from/i.test(q))
    return 'group';
  if (/ vs |beat |defeat |win against|match result| v /i.test(q)) return 'match';
  return 'other';
}

export function parseMarket(raw: Record<string, unknown>): Market {
  const outcomes =
    parseJsonField<string[]>(raw.outcomes as string[] | string) ?? [];
  const outcomePrices =
    parseJsonField<string[]>(raw.outcomePrices as string[] | string) ?? [];

  let parsedTokenIds: string[] | undefined;
  const rawIds = parseJsonField<string[]>(raw.clobTokenIds as string);
  if (Array.isArray(rawIds) && rawIds.length >= 1) {
    parsedTokenIds = rawIds.map(String);
  }

  // volume can come as string or number, and field name varies
  const rawVolume =
    raw.volume ?? raw.volumeNum ?? raw.usdcVolume ?? 0;
  const volume = typeof rawVolume === 'string'
    ? parseFloat(rawVolume) || 0
    : Number(rawVolume) || 0;

  const rawLiquidity = raw.liquidity ?? raw.liquidityNum ?? 0;
  const liquidity = typeof rawLiquidity === 'string'
    ? parseFloat(rawLiquidity) || 0
    : Number(rawLiquidity) || 0;

  return {
    id: String(raw.id ?? ''),
    question: String(raw.question ?? ''),
    slug: String(raw.slug ?? ''),
    description: raw.description ? String(raw.description) : undefined,
    clobTokenIds: String(raw.clobTokenIds ?? '[]'),
    outcomes,
    outcomePrices,
    volume,
    liquidity,
    endDate: String(raw.endDate ?? ''),
    active: Boolean(raw.active),
    closed: Boolean(raw.closed),
    image: raw.image ? String(raw.image) : undefined,
    icon: raw.icon ? String(raw.icon) : undefined,
    tags: (raw.tags as Tag[] | undefined) ?? [],
    parsedTokenIds,
    category: detectCategory(String(raw.question ?? '')),
  };
}

async function safeJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchTags(): Promise<Tag[]> {
  const res = await fetch(`${GAMMA_BASE}/tags`, {
    next: { revalidate: 3600 },
  });
  const data = await safeJson<Tag[]>(res);
  return data ?? [];
}

export async function findWorldCupTag(): Promise<Tag | null> {
  const tags = await fetchTags();
  return (
    tags.find(
      (t) =>
        /world.cup|fifa.*cup|mundial/i.test(t.slug) ||
        /world.cup|fifa.*cup|mundial/i.test(t.label),
    ) ?? null
  );
}

export async function getWorldCupMarkets(): Promise<Market[]> {
  const tag = await findWorldCupTag();

  const opts = { next: { revalidate: 60 } };
  // Ask the API to sort by volume so first pages are the most traded
  const base = 'active=true&closed=false&limit=100&order=volume&ascending=false';
  const fetches: Promise<Response>[] = [];

  if (tag) {
    // Try several tag parameter names — Gamma API isn't consistent across versions
    fetches.push(
      fetch(`${GAMMA_BASE}/markets?${base}&tag_id=${tag.id}`, opts),
      fetch(`${GAMMA_BASE}/events?${base}&tag_id=${tag.id}`, opts),
      fetch(`${GAMMA_BASE}/markets?${base}&_tag_id=${tag.id}`, opts),
      fetch(`${GAMMA_BASE}/events?${base}&_tag_id=${tag.id}`, opts),
    );
  }

  // Text search on both markets AND events — multi-outcome markets live in events
  fetches.push(
    fetch(`${GAMMA_BASE}/markets?${base}&q=World+Cup+2026`, opts),
    fetch(`${GAMMA_BASE}/events?${base}&q=World+Cup+2026`, opts),
    fetch(`${GAMMA_BASE}/markets?${base}&q=FIFA+World+Cup`, opts),
    fetch(`${GAMMA_BASE}/events?${base}&q=FIFA+World+Cup`, opts),
  );

  const responses = await Promise.allSettled(fetches);
  const allMarkets: Market[] = [];
  const seen = new Set<string>();

  const addMarket = (raw: Record<string, unknown>) => {
    const m = parseMarket(raw);
    if (m.id && !seen.has(m.id)) {
      seen.add(m.id);
      allMarkets.push(m);
    }
  };

  for (const result of responses) {
    if (result.status !== 'fulfilled') continue;
    const data = await safeJson<unknown[]>(result.value);
    if (!Array.isArray(data)) continue;

    for (const item of data) {
      const obj = item as Record<string, unknown>;

      // Events wrap their markets in a `.markets` array
      if (Array.isArray(obj.markets) && obj.markets.length > 0) {
        for (const m of obj.markets as Record<string, unknown>[]) {
          addMarket(m);
        }
      } else if (obj.id && obj.question) {
        addMarket(obj);
      }
    }
  }

  return allMarkets.sort((a, b) => b.volume - a.volume);
}

export async function getMarketBySlug(slug: string): Promise<Market | null> {
  const res = await fetch(`${GAMMA_BASE}/markets/${slug}`, {
    next: { revalidate: 30 },
  });
  if (res.ok) {
    const raw = await safeJson<Record<string, unknown>>(res);
    if (raw) return parseMarket(raw);
  }

  const res2 = await fetch(
    `${GAMMA_BASE}/markets?slug=${encodeURIComponent(slug)}&limit=1`,
    { next: { revalidate: 30 } },
  );
  const data = await safeJson<unknown>(res2);
  const list = Array.isArray(data) ? data : [];
  if (list.length > 0) return parseMarket(list[0] as Record<string, unknown>);

  return null;
}

export async function getPrice(tokenId: string): Promise<number | null> {
  const res = await fetch(`${CLOB_BASE}/midpoint?token_id=${tokenId}`, {
    cache: 'no-store',
  });
  const data = await safeJson<Record<string, unknown>>(res);
  if (!data) return null;
  const mid = data.mid;
  return typeof mid === 'number' ? mid : null;
}

export async function getPriceHistory(
  tokenId: string,
): Promise<PriceHistoryPoint[]> {
  const res = await fetch(
    `${CLOB_BASE}/prices-history?market=${tokenId}&interval=all&fidelity=100`,
    { next: { revalidate: 300 } },
  );
  const data = await safeJson<Record<string, unknown>>(res);
  if (!data) return [];
  const history = data.history ?? data;
  return Array.isArray(history) ? (history as PriceHistoryPoint[]) : [];
}

export async function getOrderbook(tokenId: string): Promise<Orderbook | null> {
  const res = await fetch(`${CLOB_BASE}/book?token_id=${tokenId}`, {
    cache: 'no-store',
  });
  return safeJson<Orderbook>(res);
}
