'use client';

import { useState } from 'react';
import { Calendar, Users, Camera, MapPin, RotateCcw, Search, X } from 'lucide-react';
import { ExpoOverview } from '@/types';

interface ExpoListProps {
  expos: ExpoOverview[];
  onSelect: (expoId: string) => void;
  onReactivate?: (expoId: string) => void;
}

export default function ExpoList({ expos, onSelect, onReactivate }: ExpoListProps) {
  const [search, setSearch] = useState('');

  if (expos.length === 0) {
    return (
      <div className="text-center py-20 text-gray-600">
        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No expos yet. Create your first expo to get started.</p>
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
    <div className="px-6 pb-6">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search expos by name or venue..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white text-sm placeholder:text-gray-500 outline-none focus:border-purple-500/50 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No expos found for &ldquo;{search}&rdquo;</p>
        </div>
      )}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map(expo => {
        const isDeactivated = !expo.is_active;
        const isActive = expo.is_active && new Date(expo.end_date) >= new Date();
        const isPast = expo.is_active && new Date(expo.end_date) < new Date();

        return (
          <div
            key={expo.id}
            className={`text-left border rounded-2xl p-5 transition-all ${
              isDeactivated
                ? 'bg-red-500/5 border-red-500/15 opacity-60'
                : 'bg-white/5 hover:bg-white/8 border-white/10 hover:border-purple-500/30 cursor-pointer group'
            }`}
          >
            <div onClick={() => onSelect(expo.id)} className="cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <h3 className={`font-bold text-lg transition-colors ${
                  isDeactivated ? 'text-gray-400' : 'text-white group-hover:text-purple-200'
                }`}>{expo.name}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isDeactivated ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                  isActive ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
                  isPast ? 'bg-gray-500/15 text-gray-400 border border-gray-500/20' :
                  'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                }`}>
                  {isDeactivated ? 'Deactivated' : isActive ? 'Active' : isPast ? 'Completed' : 'Upcoming'}
                </span>
              </div>

              {expo.venue && (
                <p className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
                  <MapPin className="w-3.5 h-3.5" /> {expo.venue}
                </p>
              )}

              <p className="text-gray-500 text-xs mb-4">
                {new Date(expo.start_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                {' — '}
                {new Date(expo.end_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className={`text-lg font-black ${isDeactivated ? 'text-gray-500' : 'text-white'}`}>{expo.total_photos}</div>
                  <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                    <Camera className="w-3 h-3" /> Photos
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-black ${isDeactivated ? 'text-gray-500' : 'text-white'}`}>{expo.unique_visitors}</div>
                  <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> Visitors
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-black ${isDeactivated ? 'text-gray-500' : 'text-white'}`}>{expo.group_count}</div>
                  <div className="text-gray-500 text-xs">Groups</div>
                </div>
              </div>
            </div>

            {/* Reactivate button for deactivated expos */}
            {isDeactivated && onReactivate && (
              <button
                onClick={(e) => { e.stopPropagation(); onReactivate(expo.id); }}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
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
