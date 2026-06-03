export type MarketCategory = 'champion' | 'match' | 'goalscorer' | 'group' | 'other';

export interface Tag {
  id: number | string;
  label: string;
  slug: string;
}

export interface Market {
  id: string;
  question: string;
  slug: string;
  description?: string;
  clobTokenIds: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: number;
  liquidity: number;
  endDate: string;
  active: boolean;
  closed: boolean;
  image?: string;
  icon?: string;
  tags?: Tag[];
  parsedTokenIds?: string[];
  category?: MarketCategory;
  isEvent?: boolean; // true = built from a Polymarket event (multi-market group)
}

export interface OrderbookLevel {
  price: string;
  size: string;
}

export interface Orderbook {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export interface PriceHistoryPoint {
  t: number;
  p: number;
}

export interface MarketFilters {
  category: MarketCategory | 'all';
  status: 'active' | 'closed' | 'all';
  search: string;
  sort: 'volume' | 'endDate';
}
