import { NextResponse } from 'next/server';
import { getPriceHistory } from '@/lib/polymarket';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');

  if (!tokenId) {
    return NextResponse.json({ error: 'tokenId required' }, { status: 400 });
  }

  try {
    const history = await getPriceHistory(tokenId);
    return NextResponse.json(history);
  } catch (err) {
    console.error('History API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 },
    );
  }
}
