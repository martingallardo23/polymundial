'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { PriceHistoryPoint } from '@/lib/types';

export interface PriceSeries {
  outcome: string;
  data: PriceHistoryPoint[];
}

// Distinct palette: top outcomes + gray for "Otros"
const COLORS = [
  '#059669', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#9ca3af', // gray → Others
];

/**
 * Merges N price series that may have different timestamps into a single
 * array suitable for recharts. Uses forward-fill for missing points.
 * Samples to ≤150 points to avoid chart clutter.
 */
function mergeHistories(
  series: PriceSeries[],
  withOthers: boolean,
): Record<string, number | string>[] {
  const nonEmpty = series.filter((s) => s.data.length > 0);
  if (!nonEmpty.length) return [];

  const allTs = Array.from(
    new Set(nonEmpty.flatMap((s) => s.data.map((p) => p.t))),
  ).sort((a, b) => a - b);

  const step = Math.max(1, Math.floor(allTs.length / 150));
  const sampled = allTs.filter(
    (_, i) => i % step === 0 || i === allTs.length - 1,
  );

  // Pre-sort each series
  const sorted = series.map((s) => ({
    key: s.outcome,
    pts: [...s.data].sort((a, b) => a.t - b.t),
  }));
  const cursors = sorted.map(() => 0);
  const lastP = sorted.map(() => 0);

  return sampled.map((ts) => {
    const point: Record<string, number | string> = {
      date: new Date(ts * 1000).toLocaleDateString('es-AR', {
        month: 'short',
        day: 'numeric',
      }),
    };

    let topSum = 0;
    for (let i = 0; i < sorted.length; i++) {
      const { pts } = sorted[i];
      while (
        cursors[i] + 1 < pts.length &&
        pts[cursors[i] + 1].t <= ts
      ) {
        cursors[i]++;
      }
      if (pts.length > 0 && pts[cursors[i]].t <= ts) {
        lastP[i] = pts[cursors[i]].p;
      }
      const pct = Math.round(lastP[i] * 1000) / 10;
      point[sorted[i].key] = pct;
      topSum += lastP[i];
    }

    if (withOthers) {
      point['Otros'] = Math.max(0, Math.round((1 - topSum) * 1000) / 10);
    }

    return point;
  });
}

interface Props {
  series: PriceSeries[];
  /** Show an "Otros" line = 100% minus sum of displayed series */
  withOthers?: boolean;
}

export default function PriceChart({ series, withOthers = false }: Props) {
  const hasSomeData = series.some((s) => s.data.length > 0);

  if (!hasSomeData) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg">
        Sin historial de precios disponible
      </div>
    );
  }

  const isSingle = series.length === 1 && !withOthers;
  const data = mergeHistories(series, withOthers);

  // Y-axis: for single binary line use [0,100], for multi use auto-scaled
  const maxPct = isSingle
    ? 100
    : Math.max(
        ...series.flatMap((s) => s.data.map((p) => p.p * 100)),
        withOthers ? 0 : 0,
      );
  const yMax = isSingle ? 100 : Math.min(100, Math.ceil((maxPct * 1.25) / 5) * 5);

  const displayKeys = [
    ...series.map((s) => s.outcome),
    ...(withOthers ? ['Otros'] : []),
  ];

  return (
    <div className={isSingle ? 'h-48' : 'h-64'}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, yMax]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          {isSingle && (
            <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="4 4" />
          )}
          <Tooltip
            formatter={(value, name) => [
              `${Number(value ?? 0).toFixed(1)}%`,
              String(name ?? ''),
            ]}
            labelStyle={{ fontSize: 11, color: '#6b7280' }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          />
          {!isSingle && (
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(v: string) =>
                v.length > 14 ? v.slice(0, 13) + '…' : v
              }
            />
          )}
          {displayKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[i] ?? '#9ca3af'}
              strokeWidth={isSingle ? 2 : 1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              strokeDasharray={key === 'Otros' ? '4 3' : undefined}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
