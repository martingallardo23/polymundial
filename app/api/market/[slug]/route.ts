import { NextResponse } from 'next/server';
import { getMarketBySlug } from '@/lib/polymarket';

export const revalidate = 30;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const market = await getMarketBySlug(slug);
    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    return NextResponse.json(market);
  } catch (err) {
    console.error('Market API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch market' },
      { status: 500 },
    );
  }
}
