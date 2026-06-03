import { NextResponse } from 'next/server';
import { getWorldCupMarkets } from '@/lib/polymarket';

export const revalidate = 60;

export async function GET() {
  try {
    const markets = await getWorldCupMarkets();
    return NextResponse.json(markets);
  } catch (err) {
    console.error('Markets API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 },
    );
  }
}
