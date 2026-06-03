'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { PriceHistoryPoint } from '@/lib/types';

interface Props {
  data: PriceHistoryPoint[];
  outcome?: string;
}

export default function PriceChart({ data, outcome = 'Sí' }: Props) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg">
        Sin historial de precios disponible
      </div>
    );
  }

  const formatted = data.map((p) => ({
    date: new Date(p.t * 1000).toLocaleDateString('es-AR', {
      month: 'short',
      day: 'numeric',
    }),
    pct: Math.round(p.p * 1000) / 10,
    ts: p.t,
  }));

  const currentPct = formatted[formatted.length - 1]?.pct ?? 0;

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-gray-900 tabular-nums">
          {currentPct.toFixed(1)}%
        </span>
        <span className="text-sm text-gray-500">{outcome}</span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formatted}
            margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="4 4" />
            <Tooltip
              formatter={(value) => [
                typeof value === 'number' ? `${value.toFixed(1)}%` : `${value}`,
                outcome,
              ]}
              labelStyle={{ fontSize: 11, color: '#6b7280' }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            />
            <Line
              type="monotone"
              dataKey="pct"
              stroke="#059669"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
