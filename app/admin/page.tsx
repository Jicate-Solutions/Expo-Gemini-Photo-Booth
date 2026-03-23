'use client';

import { useState } from 'react';
import { Lock, Download, Users, Camera, Briefcase, Star, LogOut, Eye, EyeOff, Trash2, ChevronDown, ChevronUp, RefreshCw, MessageCircle } from 'lucide-react';

interface Row {
  id: string;
  created_at: string;
  name: string;
  organization: string;
  email: string;
  mobile_number: string;
  selected_theme: string;
  theme_type: string;
  career_style: string;
  transformed_photo_url: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Row[]>([]);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (pwd: string) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed');
    return json.data || [];
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const rows = await fetchData(password);
      setData(rows);
      setLoggedIn(true);
    } catch {
      setError('Wrong password or server error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const rows = await fetchData(password);
      setData(rows);
    } finally {
      setRefreshing(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['#', 'Date & Time', 'Name', 'Organization', 'Email', 'WhatsApp', 'Theme', 'Type', 'Career Style', 'Photo URL'];
    const rows = data.map((r, i) => [
      i + 1,
      new Date(r.created_at).toLocaleString('en-IN'),
      r.name,
      r.organization || '',
      r.email,
      r.mobile_number,
      r.selected_theme,
      r.theme_type,
      r.career_style || '',
      r.transformed_photo_url || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-booth-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Delete all records for ${email}?`)) return;
    setDeletingEmail(email);
    try {
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, email }),
      });
      if (res.ok) setData(prev => prev.filter(r => r.email !== email));
    } finally {
      setDeletingEmail(null);
    }
  };

  // Group rows by email — one card per unique visitor
  const visitorMap = new Map<string, Row & { photoCount: number; photos: { url: string; theme: string; theme_type: string; created_at: string }[] }>();
  for (const row of data) {
    if (!visitorMap.has(row.email)) {
      visitorMap.set(row.email, { ...row, photoCount: 0, photos: [] });
    }
    const v = visitorMap.get(row.email)!;
    v.photoCount += 1;
    if (row.transformed_photo_url && !row.transformed_photo_url.startsWith('data:')) {
      v.photos.push({ url: row.transformed_photo_url, theme: row.selected_theme, theme_type: row.theme_type, created_at: row.created_at });
    }
  }
  const visitors = Array.from(visitorMap.values()).reverse();
  const totalPhotos = data.length;
  const totalCareer = data.filter(r => r.theme_type === 'career').length;
  const totalFun = data.filter(r => r.theme_type === 'fun').length;

  // ── LOGIN SCREEN ──
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors">
              <LogOut className="w-4 h-4 rotate-180" /> Back to Booth
            </a>
            <div className="w-14 h-14 bg-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-purple-400" />
            </div>
            <h1 className="text-white font-bold text-2xl">Admin Access</h1>
            <p className="text-gray-500 text-sm mt-1">Gemini Magic Booth — Visitor Data</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50 pr-12"
                autoComplete="off"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading || !password}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'Checking...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ──
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-xl">Visitor Dashboard</h1>
          <p className="text-gray-500 text-xs mt-0.5">Gemini Magic Booth — {visitors.length} unique visitors · {totalPhotos} total photos</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={downloadCSV}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            <Download className="w-4 h-4" /> Download CSV
          </button>
          <button onClick={() => { setLoggedIn(false); setPassword(''); setData([]); }}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 px-6 py-5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{visitors.length}</div>
            <div className="text-gray-500 text-xs">Unique Visitors</div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center">
            <Camera className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{totalPhotos}</div>
            <div className="text-gray-500 text-xs">Total Photos</div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-sky-600/20 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{totalCareer}</div>
            <div className="text-gray-500 text-xs">Career Themes</div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{totalFun}</div>
            <div className="text-gray-500 text-xs">Fun Themes</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 pb-8">
        {visitors.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No visitors yet. Data will appear here after someone uses the booth.</p>
          </div>
        ) : (
          <div className="border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">#</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Date & Time</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Organization</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Email</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">WhatsApp</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Theme</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Photos</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Photo</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((row, i) => {
                    const phone = row.mobile_number?.replace(/\D/g, '') || '';
                    const waPhone = phone.length === 10 ? `91${phone}` : phone;
                    return (
                      <>
                        <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                            {new Date(row.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="px-4 py-3 text-white font-medium">{row.name}</td>
                          <td className="px-4 py-3 text-gray-400">{row.organization || '—'}</td>
                          <td className="px-4 py-3 text-gray-300">{row.email}</td>
                          <td className="px-4 py-3">
                            {waPhone ? (
                              <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-green-400 hover:text-green-300 font-medium">
                                <MessageCircle className="w-3.5 h-3.5" />
                                {row.mobile_number}
                              </a>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              row.theme_type === 'career'
                                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/20'
                                : 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                            }`}>
                              {row.theme_type === 'career' ? '💼' : '✨'} {row.selected_theme}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.photoCount > 1 ? (
                              <button
                                onClick={() => setExpandedEmail(expandedEmail === row.email ? null : row.email)}
                                className="inline-flex items-center gap-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full transition-colors">
                                {row.photoCount}
                                {expandedEmail === row.email ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            ) : (
                              <span className="text-gray-500 text-xs">1</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.photos.length > 0 ? (
                              <a href={row.photos[0].url} target="_blank" rel="noopener noreferrer">
                                <img src={row.photos[0].url} alt={row.selected_theme}
                                  className="w-10 h-10 object-cover rounded-lg border border-white/10 hover:border-purple-400/50 transition-colors" />
                              </a>
                            ) : (
                              <span className="text-gray-600 text-xs">No image</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDelete(row.email)} disabled={deletingEmail === row.email}
                              className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40" title="Delete visitor">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        {expandedEmail === row.email && row.photos.length > 1 && (
                          <tr key={`${row.id}-expanded`} className="bg-white/3 border-b border-white/5">
                            <td colSpan={10} className="px-6 py-4">
                              <p className="text-gray-500 text-xs mb-3">All photos for {row.name}</p>
                              <div className="flex flex-wrap gap-3">
                                {row.photos.map((photo, idx) => (
                                  <a key={idx} href={photo.url} target="_blank" rel="noopener noreferrer" className="group">
                                    <img src={photo.url} alt={photo.theme}
                                      className="w-20 h-20 object-cover rounded-xl border border-white/10 group-hover:border-purple-400/50 transition-colors" />
                                    <p className="mt-1 text-center text-xs text-gray-500">{photo.theme}</p>
                                  </a>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
