import { NextResponse } from 'next/server';
import { getPrice } from '@/lib/polymarket';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');

  if (!tokenId) {
    return NextResponse.json({ error: 'tokenId required' }, { status: 400 });
  }

  try {
    const price = await getPrice(tokenId);
    return NextResponse.json(
      { price },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('Price API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch price' },
      { status: 500 },
    );
  }
}
