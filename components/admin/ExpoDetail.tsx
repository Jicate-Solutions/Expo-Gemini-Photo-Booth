'use client';

import { useState, useEffect } from 'react';
import { Camera, Users, Briefcase, Star, Download, MessageCircle, ChevronDown, ChevronUp, Search, Pencil, Trash2, Clapperboard } from 'lucide-react';
import ReelsContest from '@/components/admin/ReelsContest';
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
  bib_number?: string | null;
  gender?: string | null;
}

interface ExpoDetailProps {
  expoId: string;
  adminToken: string;
  isActive?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReactivate?: () => void;
}

export default function ExpoDetail({ expoId, adminToken, isActive = true, onEdit, onDelete, onReactivate }: ExpoDetailProps) {
  const [stats, setStats] = useState<ExpoStats | null>(null);
  const [visitors, setVisitors] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterThemeType, setFilterThemeType] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  // Marathon expos also run the Reels Contest → show a second tab
  const [hasReels, setHasReels] = useState(false);
  const [tab, setTab] = useState<'booth' | 'reels'>('booth');

  useEffect(() => {
    setTab('booth');
    fetch(`/api/expos/${expoId}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(({ data }) => {
        const meta = (data?.metadata ?? {}) as Record<string, unknown>;
        setHasReels(meta.mode === 'marathon' || meta.reels_enabled === true);
      })
      .catch(() => setHasReels(false));
  }, [expoId]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/expos/${expoId}/stats`, { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken, expoId, limit: 500 }),
      }).then(r => r.json()),
    ]).then(([statsData, visitorsData]) => {
      setStats(statsData);
      setVisitors(visitorsData.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [expoId, adminToken, refreshKey]);

  if (loading) return (
    <div className="flex items-center justify-center gap-3 py-24 text-slate-500 text-sm">
      <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> Loading stats...
    </div>
  );
  if (!stats) return <div className="text-center py-20 text-slate-500">Failed to load stats</div>;

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
    const headers = ['#', 'Date', 'Name', 'Bib', 'Gender', 'Group', 'WhatsApp', 'Theme', 'Type', 'Photo URL'];
    const csvRows = visitors.map((r, i) => [
      i + 1, new Date(r.created_at).toLocaleString('en-IN'), r.name, r.bib_number || '', r.gender ? r.gender[0].toUpperCase() + r.gender.slice(1) : '', r.organization || '',
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

  const statCards = [
    { icon: Users, value: stats.summary.unique_visitors, label: 'Unique Visitors', bg: 'bg-sky-50 border-sky-100', color: 'text-sky-600' },
    { icon: Camera, value: stats.summary.total_photos, label: 'Total Photos', bg: 'bg-emerald-50 border-emerald-100', color: 'text-emerald-600' },
    { icon: Briefcase, value: stats.summary.total_groups, label: 'Groups', bg: 'bg-amber-50 border-amber-100', color: 'text-amber-600' },
    { icon: Star, value: stats.summary.avg_photos_per_visitor, label: 'Avg Photos / Visitor', bg: 'bg-violet-50 border-violet-100', color: 'text-violet-600' },
  ];

  const hasBib = visitors.some(r => r.bib_number);
  const hasGender = visitors.some(r => r.gender);

  const themePill = (type: string) =>
    type === 'career'
      ? 'bg-sky-50 text-sky-700 border-sky-100'
      : 'bg-violet-50 text-violet-700 border-violet-100';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
      {/* Status Banner for deactivated expos */}
      {!isActive && (
        <div className="mt-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between gap-3">
          <span className="text-red-700 text-sm font-medium">This expo is deactivated — booth login is disabled</span>
          {onReactivate && (
            <button onClick={onReactivate}
              className="shrink-0 flex items-center gap-1.5 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              Reactivate
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-5 flex items-center gap-2.5 flex-wrap">
        {onEdit && (
          <button onClick={onEdit}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors">
            <Pencil className="w-4 h-4" /> Edit Expo
          </button>
        )}
        {isActive && onDelete && (
          <button onClick={() => {
            if (confirm(`Are you sure you want to deactivate "${stats.expo.name}"? This will hide it from the booth login but preserve all data.`)) {
              onDelete();
            }
          }}
            className="flex items-center gap-2 bg-white hover:bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors">
            <Trash2 className="w-4 h-4" /> Deactivate Expo
          </button>
        )}
        {!isActive && onReactivate && (
          <button onClick={onReactivate}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-colors">
            Reactivate Expo
          </button>
        )}
      </div>

      {/* Tabs: Poster Booth | Reels Contest (marathon expos) */}
      {hasReels && (
        <div className="mt-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {([['booth', Camera, 'Poster Booth'], ['reels', Clapperboard, 'Reels Contest']] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                tab === id ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      )}

      {tab === 'reels' && hasReels ? (
        <ReelsContest expoId={expoId} adminToken={adminToken} />
      ) : (
      <>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 py-5">
        {statCards.map(s => (
          <div key={s.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 ${s.bg} border rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">{s.value}</div>
              <div className="text-slate-500 text-xs font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Group Breakdown */}
      {stats.group_breakdown.length > 0 && (
        <section className="pb-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Group Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {stats.group_breakdown.map(g => (
              <div key={g.id} className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm">
                <div className="font-semibold text-slate-900 text-sm truncate">{g.name}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span><b className="text-slate-700">{g.photo_count}</b> photos</span>
                  <span><b className="text-slate-700">{g.visitor_count}</b> visitors</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Themes */}
      <section className="pb-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Top Themes</h3>
        <div className="flex flex-wrap gap-2">
          {stats.top_themes.length === 0 && <span className="text-sm text-slate-400">No photos yet</span>}
          {stats.top_themes.map(t => (
            <span key={t.theme} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${themePill(t.type)}`}>
              {t.type === 'career' ? 'Career' : 'Fun'}: {t.theme}
              <span className="ml-1 bg-white/80 rounded-full px-1.5 tabular-nums">{t.count}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Visitors: filters + table in one card */}
      <section className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-bold text-slate-900 mr-auto">
            Visitors <span className="text-slate-400 font-medium">({filteredVisitors.length})</span>
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search name, mobile, group..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus-visible:border-emerald-500 focus-visible:ring-emerald-500/15" />
          </div>
          <select value={filterThemeType} onChange={e => setFilterThemeType(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500">
            <option value="">All Types</option>
            <option value="career">Career</option>
            <option value="fun">Fun</option>
            <option value="custom">Custom</option>
          </select>
          <button onClick={downloadCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['#', 'Date', 'Name', ...(hasBib ? ['Bib'] : []), ...(hasGender ? ['Gender'] : []), 'Group', 'WhatsApp', 'Theme', 'Photos', 'Photo'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVisitors.length === 0 && (
                <tr><td colSpan={8 + (hasBib ? 1 : 0) + (hasGender ? 1 : 0)} className="px-4 py-12 text-center text-slate-400">No visitors match your filters</td></tr>
              )}
              {filteredVisitors.map((row, i) => {
                const phone = row.mobile_number?.replace(/\D/g, '') || '';
                const waPhone = phone.length === 10 ? `91${phone}` : phone;
                return (
                  <tr key={row.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-semibold">{row.name}</td>
                    {hasBib && (
                      <td className="px-4 py-3">
                        {row.bib_number
                          ? <span className="inline-block bg-orange-50 text-orange-700 border border-orange-100 font-bold text-xs px-2 py-0.5 rounded-md tabular-nums">{row.bib_number}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                    )}
                    {hasGender && (
                      <td className="px-4 py-3">
                        {row.gender === 'female'
                          ? <span className="inline-block bg-pink-50 text-pink-700 border border-pink-100 font-semibold text-xs px-2 py-0.5 rounded-md">Female</span>
                          : row.gender === 'male'
                            ? <span className="inline-block bg-sky-50 text-sky-700 border border-sky-100 font-semibold text-xs px-2 py-0.5 rounded-md">Male</span>
                            : <span className="text-slate-400">—</span>}
                      </td>
                    )}
                    <td className="px-4 py-3 text-slate-600">{row.organization || '—'}</td>
                    <td className="px-4 py-3">
                      {waPhone ? (
                        <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-medium whitespace-nowrap">
                          <MessageCircle className="w-3.5 h-3.5" /> {row.mobile_number}
                        </a>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${themePill(row.theme_type)}`}>
                        {row.theme_type === 'career' ? 'Career' : 'Fun'}: {row.selected_theme}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.photoCount > 1 ? (
                        <button onClick={() => setExpandedMobile(expandedMobile === row.mobile_number ? null : row.mobile_number)}
                          className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full transition-colors">
                          {row.photoCount}
                          {expandedMobile === row.mobile_number ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      ) : <span className="text-slate-400 text-xs">1</span>}
                    </td>
                    <td className="px-4 py-3">
                      {row.photos.length > 0 ? (
                        <a href={row.photos[0].url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={row.photos[0].url} alt={row.selected_theme}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-sm hover:ring-2 hover:ring-emerald-400 transition" />
                        </a>
                      ) : <span className="text-slate-400 text-xs">No image</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      </>
      )}
    </div>
  );
}
