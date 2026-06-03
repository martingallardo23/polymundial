'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function usePricePolling(
  tokenIds: string[],
  intervalMs = 15000,
): {
  prices: Record<string, number>;
  flashing: Set<string>;
  lastUpdated: Date | null;
} {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [flashing, setFlashing] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const prevPricesRef = useRef<Record<string, number>>({});
  const idsKey = tokenIds.join(',');

  const fetchPrices = useCallback(async () => {
    if (!tokenIds.length) return;
    const results = await Promise.allSettled(
      tokenIds.map(async (tokenId) => {
        const res = await fetch(`/api/price?tokenId=${encodeURIComponent(tokenId)}`);
        if (!res.ok) return { tokenId, price: null };
        const data = (await res.json()) as { price: number | null };
        return { tokenId, price: data.price };
      }),
    );

    const newPrices: Record<string, number> = {};
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.price !== null) {
        newPrices[result.value.tokenId] = result.value.price;
      }
    }

    if (Object.keys(newPrices).length > 0) {
      const changed = new Set<string>();
      for (const [id, price] of Object.entries(newPrices)) {
        if (
          prevPricesRef.current[id] !== undefined &&
          prevPricesRef.current[id] !== price
        ) {
          changed.add(id);
        }
      }

      prevPricesRef.current = { ...prevPricesRef.current, ...newPrices };
      setPrices((prev) => ({ ...prev, ...newPrices }));
      setLastUpdated(new Date());

      if (changed.size > 0) {
        setFlashing(changed);
        setTimeout(() => setFlashing(new Set()), 1200);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    fetchPrices();
    const timer = setInterval(fetchPrices, intervalMs);
    return () => clearInterval(timer);
  }, [fetchPrices, intervalMs]);

  return { prices, flashing, lastUpdated };
}
