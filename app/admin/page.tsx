'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminHeader from '@/components/admin/AdminHeader';
import StatsOverview from '@/components/admin/StatsOverview';
import ExpoList from '@/components/admin/ExpoList';
import ExpoForm from '@/components/admin/ExpoForm';
import ExpoDetail from '@/components/admin/ExpoDetail';
import { ExpoOverview } from '@/types';

type AdminView = 'login' | 'expos' | 'create-expo' | 'edit-expo' | 'expo-detail';

interface Totals {
  total_expos: number;
  total_photos: number;
  total_visitors: number;
}

export default function AdminPage() {
  const [view, setView] = useState<AdminView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [expos, setExpos] = useState<ExpoOverview[]>([]);
  const [totals, setTotals] = useState<Totals>({ total_expos: 0, total_photos: 0, total_visitors: 0 });
  const [selectedExpoId, setSelectedExpoId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editExpoData, setEditExpoData] = useState<{ id: string; name: string; venue: string | null; start_date: string; end_date: string; username: string; groups: { id: string; name: string }[]; mode?: string } | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    const savedEmail = sessionStorage.getItem('admin_email');
    if (saved) {
      setAdminToken(saved);
      if (savedEmail) setAdminEmail(savedEmail);
      setView('expos');
      fetchExpos();
    }
    setLoading(false);
  }, []);

  const fetchExpos = async () => {
    try {
      const res = await fetch(`/api/stats/overview?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setExpos(data.expos || []);
      if (data.totals) setTotals(data.totals);
    } catch { /* ignore */ }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid credentials'); return; }
      const token = data.admin.id;
      setAdminToken(token);
      setAdminEmail(email);
      sessionStorage.setItem('admin_token', token);
      sessionStorage.setItem('admin_email', email);
      setView('expos');
      await fetchExpos();
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_email');
    setAdminToken('');
    setAdminEmail('');
    setView('login');
    setExpos([]);
    setTotals({ total_expos: 0, total_photos: 0, total_visitors: 0 });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExpos();
    setRefreshing(false);
  };

  const handleCreateExpo = async (data: {
    name: string; venue: string; start_date: string; end_date: string;
    username: string; password: string; groups: string[]; mode: string;
  }) => {
    const res = await fetch('/api/expos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create expo');
    }
    toast.success('Expo created successfully!');
    setView('expos');
    await fetchExpos();
  };

  const handleEditExpo = async (expoId: string) => {
    try {
      const res = await fetch(`/api/expos/${expoId}`);
      const { data } = await res.json();
      if (data) {
        const meta = data.metadata as Record<string, unknown> | null;
        setEditExpoData({ ...data, mode: (meta?.mode as string) || 'standard' });
        setView('edit-expo');
      }
    } catch { /* ignore */ }
  };

  const handleUpdateExpo = async (data: {
    name: string; venue: string; start_date: string; end_date: string;
    username: string; password: string; groups: string[]; mode: string;
  }) => {
    if (!editExpoData) return;

    const updateBody: Record<string, unknown> = {
      name: data.name,
      venue: data.venue,
      start_date: data.start_date,
      end_date: data.end_date,
      metadata: { mode: data.mode },
    };
    if (data.password) updateBody.password = data.password;

    const res = await fetch(`/api/expos/${editExpoData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateBody),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update expo');
    }

    const existingNames = editExpoData.groups.map(g => g.name);
    const newGroups = data.groups.filter(g => !existingNames.includes(g));
    if (newGroups.length > 0) {
      await fetch(`/api/expos/${editExpoData.id}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: newGroups }),
      });
    }

    const removedGroups = editExpoData.groups.filter(g => !data.groups.includes(g.name));
    for (const g of removedGroups) {
      await fetch(`/api/expos/${editExpoData.id}/groups`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: g.id }),
      });
    }

    setExpos(prev => prev.map(e => e.id === editExpoData.id ? {
      ...e,
      name: data.name,
      venue: data.venue,
      start_date: data.start_date,
      end_date: data.end_date,
    } : e));

    toast.success('Expo updated successfully!');
    setEditExpoData(null);
    setView('expos');
  };

  const handleDeleteExpo = async (expoId: string) => {
    try {
      const res = await fetch(`/api/expos/${expoId}`, { method: 'DELETE' });
      if (res.ok) {
        setExpos(prev => prev.map(e => e.id === expoId ? { ...e, is_active: false } : e));
        toast.success('Expo deactivated successfully');
        setSelectedExpoId(null);
        setView('expos');
      } else {
        const err = await res.json();
        toast.error('Failed to deactivate: ' + (err.error || 'Unknown error'));
      }
    } catch (e) {
      toast.error('Error: ' + String(e));
    }
  };

  const handleReactivateExpo = async (expoId: string) => {
    try {
      const res = await fetch(`/api/expos/${expoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      });
      if (res.ok) {
        setExpos(prev => prev.map(e => e.id === expoId ? { ...e, is_active: true } : e));
        toast.success('Expo reactivated!');
      } else {
        toast.error('Failed to reactivate expo');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  // Derived stats
  const activeExpos = expos.filter(e => e.is_active).length;
  const totalGroups = expos.reduce((sum, e) => sum + (e.group_count || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex items-center justify-center p-4 text-slate-900">
        {/* soft background accents */}
        <div className="fixed -top-32 -right-32 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed -bottom-32 -left-32 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm">
          <a href="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 text-sm mb-6 transition-colors">
            <LogOut className="w-4 h-4 rotate-180" /> Back to Booth
          </a>
          <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/60 p-8">
            <div className="text-center mb-7">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/jkkn-logo.png" alt="JKKN" className="h-12 mx-auto mb-5 object-contain" />
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-emerald-600" />
              </div>
              <h1 className="text-slate-900 font-bold text-2xl tracking-tight">Admin Access</h1>
              <p className="text-slate-500 text-sm mt-1">Expo Management Dashboard</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email</label>
                <input type="email" placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition" autoComplete="off" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition pr-12" autoComplete="off" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading || !email || !password}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-colors">
                {loading ? 'Checking...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {view === 'expos' && (
        <>
          <AdminHeader
            title="Expo Dashboard"
            subtitle={`${activeExpos} active of ${expos.length} expos`}
            adminEmail={adminEmail}
            onLogout={handleLogout}
            onRefresh={handleRefresh}
            onCreateExpo={() => setView('create-expo')}
            refreshing={refreshing}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
            <StatsOverview
              totalExpos={totals.total_expos}
              activeExpos={activeExpos}
              totalVisitors={totals.total_visitors}
              totalPhotos={totals.total_photos}
              totalGroups={totalGroups}
            />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">All Expos</h2>
            <span className="text-xs text-slate-500">{expos.length} total</span>
          </div>
          <ExpoList expos={expos} onSelect={(id) => { setSelectedExpoId(id); setView('expo-detail'); }} onReactivate={handleReactivateExpo} />
        </>
      )}
      {view === 'create-expo' && (
        <>
          <AdminHeader title="Create Expo" adminEmail={adminEmail} onLogout={handleLogout} onBack={() => setView('expos')} />
          <ExpoForm onSave={handleCreateExpo} onCancel={() => setView('expos')} />
        </>
      )}
      {view === 'edit-expo' && editExpoData && (
        <>
          <AdminHeader title={`Edit: ${editExpoData.name}`} adminEmail={adminEmail} onLogout={handleLogout} onBack={() => { setEditExpoData(null); setView('expo-detail'); }} />
          <ExpoForm onSave={handleUpdateExpo} onCancel={() => { setEditExpoData(null); setView('expo-detail'); }} initialData={editExpoData} />
        </>
      )}
      {view === 'expo-detail' && selectedExpoId && (
        <>
          <AdminHeader title={expos.find(e => e.id === selectedExpoId)?.name || 'Expo Detail'}
            adminEmail={adminEmail} onLogout={handleLogout} onBack={() => setView('expos')} />
          <ExpoDetail
            expoId={selectedExpoId}
            adminToken={adminToken}
            isActive={expos.find(e => e.id === selectedExpoId)?.is_active ?? true}
            onEdit={() => handleEditExpo(selectedExpoId)}
            onDelete={() => handleDeleteExpo(selectedExpoId)}
            onReactivate={() => handleReactivateExpo(selectedExpoId)}
          />
        </>
      )}
    </div>
  );
}
