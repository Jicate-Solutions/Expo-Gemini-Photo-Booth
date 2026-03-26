'use client';

import { Calendar, Users, Camera, MapPin } from 'lucide-react';
import { ExpoOverview } from '@/types';

interface ExpoListProps {
  expos: ExpoOverview[];
  onSelect: (expoId: string) => void;
}

export default function ExpoList({ expos, onSelect }: ExpoListProps) {
  if (expos.length === 0) {
    return (
      <div className="text-center py-20 text-gray-600">
        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No expos yet. Create your first expo to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {expos.map(expo => {
        const isActive = expo.is_active && new Date(expo.end_date) >= new Date();
        const isPast = new Date(expo.end_date) < new Date();

        return (
          <button
            key={expo.id}
            onClick={() => onSelect(expo.id)}
            className="text-left bg-white/5 hover:bg-white/8 border border-white/10 hover:border-purple-500/30 rounded-2xl p-5 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-white text-lg group-hover:text-purple-200 transition-colors">{expo.name}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isActive ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
                isPast ? 'bg-gray-500/15 text-gray-400 border border-gray-500/20' :
                'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
              }`}>
                {isActive ? 'Active' : isPast ? 'Completed' : 'Upcoming'}
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
                <div className="text-lg font-black text-white">{expo.total_photos}</div>
                <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                  <Camera className="w-3 h-3" /> Photos
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-white">{expo.unique_visitors}</div>
                <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" /> Visitors
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-white">{expo.group_count}</div>
                <div className="text-gray-500 text-xs">Groups</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
