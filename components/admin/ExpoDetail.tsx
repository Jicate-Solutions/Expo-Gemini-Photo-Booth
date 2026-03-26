'use client';

import { useState, useEffect } from 'react';
import { Camera, Users, Briefcase, Star, Download, MessageCircle, ChevronDown, ChevronUp, Search, Pencil, Trash2 } from 'lucide-react';
import { ExpoStats } from '@/types';
import { Input } from '@/components/ui/input';

interface Row {
  id: string;
  created_at: string;
  name: string;
  organization: string;
  mobile_number: string;
  selected_theme: string;
  theme_type: string;
  career_style: string;
  transformed_photo_url: string;
}

interface ExpoDetailProps {
  expoId: string;
  adminToken: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ExpoDetail({ expoId, adminToken, onEdit, onDelete }: ExpoDetailProps) {
  const [stats, setStats] = useState<ExpoStats | null>(null);
  const [visitors, setVisitors] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterThemeType, setFilterThemeType] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/expos/${expoId}/stats`).then(r => r.json()),
      fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken, expoId, limit: 500 }),
      }).then(r => r.json()),
    ]).then(([statsData, visitorsData]) => {
      setStats(statsData);
      setVisitors(visitorsData.data || []);
    }).finally(() => setLoading(false));
  }, [expoId, adminToken]);

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-500">Loading stats...</div>;
  if (!stats) return <div className="text-center py-20 text-gray-500">Failed to load stats</div>;

  // Build visitor map
  const visitorMap = new Map<string, Row & { photoCount: number; photos: { url: string; theme: string; theme_type: string; created_at: string }[] }>();
  for (const row of visitors) {
    const key = row.mobile_number || row.id;
    if (!visitorMap.has(key)) visitorMap.set(key, { ...row, photoCount: 0, photos: [] });
    const v = visitorMap.get(key)!;
    v.photoCount++;
    if (row.transformed_photo_url && !row.transformed_photo_url.startsWith('data:'))
      v.photos.push({ url: row.transformed_photo_url, theme: row.selected_theme, theme_type: row.theme_type, created_at: row.created_at });
  }

  let filteredVisitors = Array.from(visitorMap.values());
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredVisitors = filteredVisitors.filter(v =>
      v.name.toLowerCase().includes(q) || v.mobile_number.includes(q) || v.organization.toLowerCase().includes(q));
  }
  if (filterThemeType) {
    const matching = new Set(visitors.filter(r => r.theme_type === filterThemeType).map(r => r.mobile_number));
    filteredVisitors = filteredVisitors.filter(v => matching.has(v.mobile_number));
  }

  const downloadCSV = () => {
    const headers = ['#', 'Date', 'Name', 'Group', 'WhatsApp', 'Theme', 'Type', 'Photo URL'];
    const csvRows = visitors.map((r, i) => [
      i + 1, new Date(r.created_at).toLocaleString('en-IN'), r.name, r.organization || '',
      r.mobile_number, r.selected_theme, r.theme_type, r.transformed_photo_url || '',
    ]);
    const csv = [headers, ...csvRows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stats.expo.name.replace(/\s+/g, '-')}-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Action Buttons */}
      {(onEdit || onDelete) && (
        <div className="px-6 pt-4 flex items-center gap-3">
          {onEdit && (
            <button onClick={onEdit}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              <Pencil className="w-4 h-4" /> Edit Expo
            </button>
          )}
          {onDelete && (
            <button onClick={() => {
              if (confirm(`Are you sure you want to deactivate "${stats.expo.name}"? This will hide it from the booth login but preserve all data.`)) {
                onDelete();
              }
            }}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              <Trash2 className="w-4 h-4" /> Deactivate Expo
            </button>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-purple-400" /></div>
          <div><div className="text-2xl font-black text-white">{stats.summary.unique_visitors}</div><div className="text-gray-500 text-xs">Unique Visitors</div></div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center"><Camera className="w-5 h-5 text-green-400" /></div>
          <div><div className="text-2xl font-black text-white">{stats.summary.total_photos}</div><div className="text-gray-500 text-xs">Total Photos</div></div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-sky-600/20 rounded-xl flex items-center justify-center"><Briefcase className="w-5 h-5 text-sky-400" /></div>
          <div><div className="text-2xl font-black text-white">{stats.summary.total_groups}</div><div className="text-gray-500 text-xs">Groups</div></div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center"><Star className="w-5 h-5 text-violet-400" /></div>
          <div><div className="text-2xl font-black text-white">{stats.summary.avg_photos_per_visitor}</div><div className="text-gray-500 text-xs">Avg Photos/Visitor</div></div>
        </div>
      </div>

      {/* Group Breakdown */}
      {stats.group_breakdown.length > 0 && (
        <div className="px-6 pb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Group Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {stats.group_breakdown.map(g => (
              <div key={g.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="font-medium text-white text-sm truncate">{g.name}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{g.photo_count} photos</span><span>{g.visitor_count} visitors</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Themes */}
      <div className="px-6 pb-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Themes</h3>
        <div className="flex flex-wrap gap-2">
          {stats.top_themes.map(t => (
            <span key={t.theme} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
              t.type === 'career' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/20' : 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
            }`}>
              {t.type === 'career' ? 'Career' : 'Fun'}: {t.theme} ({t.count})
            </span>
          ))}
        </div>
      </div>

      {/* Filters + Export */}
      <div className="px-6 pb-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input placeholder="Search name, mobile, group..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-sm" />
        </div>
        <select value={filterThemeType} onChange={e => setFilterThemeType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 outline-none">
          <option value="">All Types</option>
          <option value="career">Career</option>
          <option value="fun">Fun</option>
          <option value="custom">Custom</option>
        </select>
        <button onClick={downloadCSV}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>

      {/* Visitor Table */}
      <div className="px-6 pb-8">
        <div className="border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">#</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Group</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">WhatsApp</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Theme</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Photos</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Photo</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.map((row, i) => {
                  const phone = row.mobile_number?.replace(/\D/g, '') || '';
                  const waPhone = phone.length === 10 ? `91${phone}` : phone;
                  return (
                    <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-gray-400">{row.organization || '—'}</td>
                      <td className="px-4 py-3">
                        {waPhone ? (
                          <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-green-400 hover:text-green-300 font-medium">
                            <MessageCircle className="w-3.5 h-3.5" /> {row.mobile_number}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row.theme_type === 'career' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/20' : 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                        }`}>
                          {row.theme_type === 'career' ? 'Career' : 'Fun'}: {row.selected_theme}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.photoCount > 1 ? (
                          <button onClick={() => setExpandedMobile(expandedMobile === row.mobile_number ? null : row.mobile_number)}
                            className="inline-flex items-center gap-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full transition-colors">
                            {row.photoCount}
                            {expandedMobile === row.mobile_number ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        ) : <span className="text-gray-500 text-xs">1</span>}
                      </td>
                      <td className="px-4 py-3">
                        {row.photos.length > 0 ? (
                          <a href={row.photos[0].url} target="_blank" rel="noopener noreferrer">
                            <img src={row.photos[0].url} alt={row.selected_theme}
                              className="w-10 h-10 object-cover rounded-lg border border-white/10 hover:border-purple-400/50 transition-colors" />
                          </a>
                        ) : <span className="text-gray-600 text-xs">No image</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
