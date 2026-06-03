import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GAMMA_BASE = 'https://gamma-api.polymarket.com';

export async function GET() {
  const [tagsRes, sampleRes] = await Promise.allSettled([
    fetch(`${GAMMA_BASE}/tags?limit=200`),
    fetch(`${GAMMA_BASE}/markets?limit=3&order=volume&ascending=false`),
  ]);

  const tags =
    tagsRes.status === 'fulfilled' && tagsRes.value.ok
      ? await tagsRes.value.json()
      : { error: 'failed' };

  const sampleMarket =
    sampleRes.status === 'fulfilled' && sampleRes.value.ok
      ? await sampleRes.value.json()
      : { error: 'failed' };

  // Filter tags that look World Cup related
  const wcTags = Array.isArray(tags)
    ? tags.filter((t: { label: string; slug: string }) =>
        /world.cup|fifa|mundial|soccer|football|sport/i.test(t.slug) ||
        /world.cup|fifa|mundial|soccer|football|sport/i.test(t.label),
      )
    : [];

  return NextResponse.json({
    totalTags: Array.isArray(tags) ? tags.length : 0,
    wcRelatedTags: wcTags,
    allTags: tags,
    sampleMarketFields: Array.isArray(sampleMarket)
      ? sampleMarket.map((m: Record<string, unknown>) => ({
          question: m.question,
          tags: m.tags,
          volume: m.volume,
          volumeNum: m.volumeNum,
          active: m.active,
          closed: m.closed,
        }))
      : sampleMarket,
  });
}
