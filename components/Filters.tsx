'use client';

import type { MarketFilters } from '@/lib/types';

interface Props {
  filters: MarketFilters;
  onChange: (f: MarketFilters) => void;
  total: number;
}

export default function Filters({ filters, onChange, total }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
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
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: '' })}
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
            aria-label="Limpiar búsqueda"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <label className="text-xs text-gray-500">Estado:</label>
        <select
          value={filters.status}
          onChange={(e) =>
            onChange({ ...filters, status: e.target.value as MarketFilters['status'] })
          }
          className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white cursor-pointer"
        >
          <option value="active">Activos</option>
          <option value="closed">Cerrados</option>
          <option value="all">Todos</option>
        </select>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <label className="text-xs text-gray-500">Orden:</label>
        <select
          value={filters.sort}
          onChange={(e) =>
            onChange({ ...filters, sort: e.target.value as MarketFilters['sort'] })
          }
          className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white cursor-pointer"
        >
          <option value="volume">Volumen</option>
          <option value="endDate">Fecha cierre</option>
        </select>
      </div>

      {total > 0 && (
        <span className="text-xs text-gray-400 shrink-0 ml-auto">
          {total} mercado{total !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
