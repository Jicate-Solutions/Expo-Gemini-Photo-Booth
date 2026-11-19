'use client';

import { useState } from 'react';
import { Calendar, Users, Camera, MapPin, RotateCcw, Search, X, Layers, ChevronRight } from 'lucide-react';
import { ExpoOverview } from '@/types';

interface ExpoListProps {
  expos: ExpoOverview[];
  onSelect: (expoId: string) => void;
  onReactivate?: (expoId: string) => void;
}

const STATUS_STYLES = {
  deactivated: { label: 'Deactivated', pill: 'bg-red-50 text-red-600 border-red-100', dot: 'bg-red-500' },
  active: { label: 'Active', pill: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500 animate-pulse' },
  completed: { label: 'Completed', pill: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  upcoming: { label: 'Upcoming', pill: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
} as const;

export default function ExpoList({ expos, onSelect, onReactivate }: ExpoListProps) {
  const [search, setSearch] = useState('');

  if (expos.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl text-slate-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p>No expos yet. Create your first expo to get started.</p>
        </div>
      </div>
    );
  }

  // Sort: active first, then by date
  const sorted = [...expos].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  const filtered = search.trim()
    ? sorted.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.venue || '').toLowerCase().includes(search.toLowerCase())
      )
    : sorted;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search expos by name or venue..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 text-sm placeholder:text-slate-400 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Search className="w-8 h-8 mx-auto mb-3 text-slate-300" />
          <p className="text-sm">No expos found for &ldquo;{search}&rdquo;</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(expo => {
          const isDeactivated = !expo.is_active;
          const isActive = expo.is_active && new Date(expo.end_date) >= new Date();
          const isPast = expo.is_active && new Date(expo.end_date) < new Date();
          const status = STATUS_STYLES[isDeactivated ? 'deactivated' : isActive ? 'active' : isPast ? 'completed' : 'upcoming'];

          return (
            <div
              key={expo.id}
              className={`group text-left bg-white border rounded-2xl p-5 transition-all ${
                isDeactivated
                  ? 'border-slate-200 opacity-70'
                  : 'border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-slate-200/70 hover:-translate-y-0.5 hover:border-emerald-200 cursor-pointer'
              }`}
            >
              <div onClick={() => onSelect(expo.id)} className="cursor-pointer">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className={`font-bold text-base leading-snug transition-colors ${
                    isDeactivated ? 'text-slate-500' : 'text-slate-900 group-hover:text-emerald-700'
                  }`}>{expo.name}</h3>
                  <span className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${status.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  {expo.venue && (
                    <p className="flex items-center gap-1.5 text-slate-500 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {expo.venue}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(expo.start_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    {' — '}
                    {new Date(expo.end_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </p>
                </div>

                <div className="grid grid-cols-3 divide-x divide-slate-200 bg-slate-50 border border-slate-100 rounded-xl py-2.5">
                  {[
                    { icon: Camera, value: expo.total_photos, label: 'Photos' },
                    { icon: Users, value: expo.unique_visitors, label: 'Visitors' },
                    { icon: Layers, value: expo.group_count, label: 'Groups' },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <div className={`text-lg font-extrabold tabular-nums ${isDeactivated ? 'text-slate-400' : 'text-slate-900'}`}>{m.value}</div>
                      <div className="text-slate-500 text-[11px] flex items-center justify-center gap-1">
                        <m.icon className="w-3 h-3" /> {m.label}
                      </div>
                    </div>
                  ))}
                </div>

                {!isDeactivated && (
                  <div className="mt-3 flex items-center justify-end text-xs font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    View details <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Reactivate button for deactivated expos */}
              {isDeactivated && onReactivate && (
                <button
                  onClick={(e) => { e.stopPropagation(); onReactivate(expo.id); }}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
