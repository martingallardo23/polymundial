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
  if (/group [a-p]\b|(advance|qualify|progress|finish).{0,15}group|win group [a-p]/i.test(q))
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

// Tag IDs confirmed via /api/debug on the live Gamma API
const WC_TAG_IDS = new Set(['102232', '102350']); // "FIFA World Cup", "2026 FIFA World Cup"
const WC_TAG_SLUGS = /2026.fifa|fifa.world.cup/i;
// Title regex — "world cup" as consecutive words, "mundial", or FIFA (soccer governing body only)
// Deliberately tight: avoids "Stanley Cup", "World Series", "MLS Cup", etc.
const WC_TITLE = /\bworld\s+cup\b|mundial|\bfifa\b/i;

function isWorldCupItem(market: Market): boolean {
  // Explicit World Cup tag → always pass
  if (market.tags?.some((t) => WC_TAG_IDS.has(String(t.id)) || WC_TAG_SLUGS.test(t.slug))) {
    return true;
  }
  // Soccer-tagged items (id 100350) came from our Soccer+WC text queries;
  // the API already filtered their text for "World Cup" / "FIFA 2026".
  if (market.tags?.some((t) => String(t.id) === '100350')) return true;
  // No tags or unrecognised tags: require title match
  return WC_TITLE.test(market.question);
}

export async function findWorldCupTagIds(): Promise<string[]> {
  const tags = await fetchTags();
  const wc = tags.filter(
    (t) =>
      /2026.fifa.world.cup|fifa.world.cup/i.test(t.slug) ||
      /2026.fifa.world.cup|fifa.world.cup/i.test(t.label),
  );
  // Also accept the broader "world cup" slug as fallback
  if (wc.length === 0) {
    const fallback = tags.find(
      (t) =>
        /world.cup|mundial/i.test(t.slug) || /world.cup|mundial/i.test(t.label),
    );
    if (fallback) wc.push(fallback);
  }
  return wc.map((t) => String(t.id));
}

function extractOutcomeLabel(raw: Record<string, unknown>): string {
  // Polymarket often sets groupItemTitle for markets inside an event group
  if (raw.groupItemTitle && String(raw.groupItemTitle).trim()) {
    return String(raw.groupItemTitle).trim();
  }
  const q = String(raw.question ?? '');
  // "Will Argentina win the 2026 World Cup?" → "Argentina"
  const m = q.match(/^Will\s+(.+?)\s+win\b/i);
  if (m) return m[1].trim();
  // "Argentina to win the World Cup" → "Argentina"
  const m2 = q.match(/^(.+?)\s+to win\b/i);
  if (m2) return m2[1].trim();
  return q;
}

// Converts a Gamma event object (with .markets array) into a single Market entry.
// Multi-team events like "World Cup Winner" become one multi-outcome card.
export function eventToMarket(raw: Record<string, unknown>): Market {
  const subMarkets = Array.isArray(raw.markets)
    ? (raw.markets as Record<string, unknown>[]).map(parseMarket)
    : [];

  const eventTags = (raw.tags as Tag[] | undefined) ?? [];

  if (subMarkets.length === 1) {
    return {
      ...subMarkets[0],
      slug: String(raw.slug ?? subMarkets[0].slug),
      tags: eventTags,
      isEvent: true,
    };
  }

  if (subMarkets.length === 0) {
    return { ...parseMarket(raw), tags: eventTags, isEvent: true };
  }

  // Multi-market event: build a synthetic multi-outcome market
  const rawMarkets = raw.markets as Record<string, unknown>[];
  const outcomes = rawMarkets.map(extractOutcomeLabel);
  const outcomePrices = subMarkets.map((m) => m.outcomePrices[0] ?? '0');
  const parsedTokenIds = subMarkets
    .map((m) => m.parsedTokenIds?.[0] ?? '')
    .filter(Boolean);

  const totalVolume =
    subMarkets.reduce((s, m) => s + m.volume, 0) ||
    Number(raw.volume ?? raw.volumeNum ?? 0);
  const totalLiquidity = subMarkets.reduce((s, m) => s + m.liquidity, 0);

  const rawVol = raw.volume ?? raw.volumeNum ?? 0;
  const volume = totalVolume || (typeof rawVol === 'string' ? parseFloat(rawVol) : Number(rawVol));

  return {
    id: String(raw.id ?? ''),
    question: String(raw.title ?? raw.question ?? ''),
    slug: String(raw.slug ?? ''),
    description: raw.description ? String(raw.description) : undefined,
    clobTokenIds: '[]',
    outcomes,
    outcomePrices,
    volume,
    liquidity: totalLiquidity,
    endDate: String(raw.endDate ?? subMarkets[0]?.endDate ?? ''),
    active: subMarkets.some((m) => m.active),
    closed: subMarkets.every((m) => m.closed),
    image: raw.image ? String(raw.image) : undefined,
    icon: raw.icon ? String(raw.icon) : undefined,
    parsedTokenIds,
    tags: eventTags,
    category: detectCategory(String(raw.title ?? raw.question ?? '')),
    isEvent: true,
  };
}

export async function getWorldCupMarkets(): Promise<Market[]> {
  const tagIds = await findWorldCupTagIds();

  const opts = { next: { revalidate: 60 } };
  const base = 'active=true&closed=false&limit=100&order=volume&ascending=false';

  const eventFetches: Promise<Response>[] = [];
  const marketFetches: Promise<Response>[] = [];

  // Queries by specific WC tag IDs
  for (const id of tagIds) {
    eventFetches.push(fetch(`${GAMMA_BASE}/events?${base}&tag_id=${id}`, opts));
    marketFetches.push(fetch(`${GAMMA_BASE}/markets?${base}&tag_id=${id}`, opts));
  }

  // Soccer tag (100350) + WC text — catches events tagged only as Soccer
  const SOCCER_TAG = '100350';
  eventFetches.push(
    fetch(`${GAMMA_BASE}/events?${base}&tag_id=${SOCCER_TAG}&q=World+Cup`, opts),
    fetch(`${GAMMA_BASE}/events?${base}&tag_id=${SOCCER_TAG}&q=FIFA+2026`, opts),
  );
  marketFetches.push(
    fetch(`${GAMMA_BASE}/markets?${base}&tag_id=${SOCCER_TAG}&q=World+Cup`, opts),
    fetch(`${GAMMA_BASE}/markets?${base}&tag_id=${SOCCER_TAG}&q=FIFA+2026`, opts),
  );

  // Pure text search as final fallback
  eventFetches.push(
    fetch(`${GAMMA_BASE}/events?${base}&q=2026+FIFA+World+Cup`, opts),
  );
  marketFetches.push(
    fetch(`${GAMMA_BASE}/markets?${base}&q=2026+FIFA+World+Cup`, opts),
  );

  const [eventResults, marketResults] = await Promise.all([
    Promise.allSettled(eventFetches),
    Promise.allSettled(marketFetches),
  ]);

  const allMarkets: Market[] = [];
  const seen = new Set<string>(); // tracks event IDs + constituent market IDs

  // Pass 1: events (take priority — shown as grouped multi-outcome cards)
  for (const result of eventResults) {
    if (result.status !== 'fulfilled') continue;
    const data = await safeJson<unknown[]>(result.value);
    if (!Array.isArray(data)) continue;

    for (const item of data) {
      const obj = item as Record<string, unknown>;
      const eventId = String(obj.id ?? '');
      if (!eventId || seen.has(eventId)) continue;

      seen.add(eventId);
      // Mark all constituent market IDs so pass 2 skips them
      if (Array.isArray(obj.markets)) {
        for (const m of obj.markets as Record<string, unknown>[]) {
          const mid = String((m as Record<string, unknown>).id ?? '');
          if (mid) seen.add(mid);
        }
      }

      const market = eventToMarket(obj);
      if (market.question) allMarkets.push(market);
    }
  }

  // Pass 2: individual markets not already covered by an event
  for (const result of marketResults) {
    if (result.status !== 'fulfilled') continue;
    const data = await safeJson<unknown[]>(result.value);
    if (!Array.isArray(data)) continue;

    for (const item of data) {
      const obj = item as Record<string, unknown>;
      const id = String(obj.id ?? '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const m = parseMarket(obj);
      if (m.question) allMarkets.push(m);
    }
  }

  return allMarkets
    .filter(isWorldCupItem)
    .sort((a, b) => b.volume - a.volume);
}

export async function getMarketBySlug(slug: string): Promise<Market | null> {
  const opts = { next: { revalidate: 30 } };
  const s = encodeURIComponent(slug);

  const [mDirect, eDirect, mQuery, eQuery] = await Promise.allSettled([
    fetch(`${GAMMA_BASE}/markets/${slug}`, opts),
    fetch(`${GAMMA_BASE}/events/${slug}`, opts),
    fetch(`${GAMMA_BASE}/markets?slug=${s}&limit=1`, opts),
    fetch(`${GAMMA_BASE}/events?slug=${s}&limit=1`, opts),
  ]);

  // Try direct market
  if (mDirect.status === 'fulfilled' && mDirect.value.ok) {
    const raw = await safeJson<Record<string, unknown>>(mDirect.value);
    if (raw?.id) return parseMarket(raw);
  }
  // Try direct event
  if (eDirect.status === 'fulfilled' && eDirect.value.ok) {
    const raw = await safeJson<Record<string, unknown>>(eDirect.value);
    if (raw?.id) return eventToMarket(raw);
  }
  // Try market query
  if (mQuery.status === 'fulfilled') {
    const data = await safeJson<unknown[]>(mQuery.value);
    if (Array.isArray(data) && data.length > 0)
      return parseMarket(data[0] as Record<string, unknown>);
  }
  // Try event query
  if (eQuery.status === 'fulfilled') {
    const data = await safeJson<unknown[]>(eQuery.value);
    if (Array.isArray(data) && data.length > 0)
      return eventToMarket(data[0] as Record<string, unknown>);
  }

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
