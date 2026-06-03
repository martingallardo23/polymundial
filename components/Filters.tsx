'use client';

import type { MarketFilters, MarketCategory } from '@/lib/types';

const CATEGORIES: { value: MarketCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'champion', label: 'Campeón' },
  { value: 'match', label: 'Partidos' },
  { value: 'goalscorer', label: 'Goleadores' },
  { value: 'group', label: 'Grupos' },
  { value: 'other', label: 'General' },
];

interface Props {
  filters: MarketFilters;
  onChange: (f: MarketFilters) => void;
  total: number;
}

export default function Filters({ filters, onChange, total }: Props) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar mercado..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white"
        />
        <svg
          className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onChange({ ...filters, category: value })}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-150 cursor-pointer ${
              filters.category === value
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300 hover:text-emerald-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort + status + count */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Ordenar:</label>
          <select
            value={filters.sort}
            onChange={(e) =>
              onChange({ ...filters, sort: e.target.value as MarketFilters['sort'] })
            }
            className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white cursor-pointer"
          >
            <option value="volume">Volumen</option>
            <option value="endDate">Fecha cierre</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Estado:</label>
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({
                ...filters,
                status: e.target.value as MarketFilters['status'],
              })
            }
            className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white cursor-pointer"
          >
            <option value="active">Activos</option>
            <option value="closed">Cerrados</option>
            <option value="all">Todos</option>
          </select>
        </div>

        <span className="text-xs text-gray-400 ml-auto">
          {total} mercado{total !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
