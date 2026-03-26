'use client';

import { useState, useEffect } from 'react';
import { Camera, Users, ArrowLeft } from 'lucide-react';
import { ExpoStats } from '@/types';

interface ExpoStatsViewProps {
  expoId: string;
  expoName: string;
  onBack: () => void;
}

export default function ExpoStatsView({ expoId, expoName, onBack }: ExpoStatsViewProps) {
  const [stats, setStats] = useState<ExpoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/expos/${expoId}/stats`)
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [expoId]);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Loading stats...</div>;
  if (!stats) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Failed to load</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="font-bold text-xl">{expoName} Stats</h1>
          <p className="text-gray-500 text-xs">{stats.expo.start_date} — {stats.expo.end_date}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 p-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <Camera className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-3xl font-black">{stats.summary.total_photos}</div>
          <div className="text-gray-500 text-xs">Photos</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-3xl font-black">{stats.summary.unique_visitors}</div>
          <div className="text-gray-500 text-xs">Visitors</div>
        </div>
      </div>

      {stats.group_breakdown.length > 0 && (
        <div className="px-6 pb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Groups</h3>
          {stats.group_breakdown.map(g => (
            <div key={g.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mb-2">
              <span className="text-white font-medium">{g.name}</span>
              <span className="text-gray-400 text-sm">{g.photo_count} photos · {g.visitor_count} visitors</span>
            </div>
          ))}
        </div>
      )}

      {stats.top_themes.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Themes</h3>
          <div className="flex flex-wrap gap-2">
            {stats.top_themes.map(t => (
              <span key={t.theme} className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/20">
                {t.theme} ({t.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
