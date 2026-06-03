import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GAMMA_BASE = 'https://gamma-api.polymarket.com';

async function safeGet(url: string) {
  try {
    const r = await fetch(url);
    if (!r.ok) return { error: `HTTP ${r.status}`, url };
    return r.json();
  } catch (e) {
    return { error: String(e), url };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') ?? 'event';

  if (mode === 'tags') {
    const tags = await safeGet(`${GAMMA_BASE}/tags?limit=200`);
    return NextResponse.json(tags);
  }

  if (mode === 'search') {
    const q = searchParams.get('q') ?? 'world cup';
    const [markets, events] = await Promise.all([
      safeGet(`${GAMMA_BASE}/markets?limit=5&order=volume&ascending=false&q=${encodeURIComponent(q)}`),
      safeGet(`${GAMMA_BASE}/events?limit=5&order=volume&ascending=false&q=${encodeURIComponent(q)}`),
    ]);
    return NextResponse.json({ markets, events });
  }

  // Default: fetch the world-cup-winner event and nearby events
  const slug = searchParams.get('slug') ?? 'world-cup-winner';
  const [bySlug, bySearch, topMarkets] = await Promise.all([
    safeGet(`${GAMMA_BASE}/events?slug=${slug}`),
    safeGet(`${GAMMA_BASE}/events?limit=20&order=volume&ascending=false&q=world+cup`),
    safeGet(`${GAMMA_BASE}/markets?limit=10&order=volume&ascending=false&q=world+cup`),
  ]);

  return NextResponse.json({ bySlug, bySearch, topMarkets });
}
