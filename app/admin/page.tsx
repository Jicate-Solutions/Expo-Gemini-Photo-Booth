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
  const [editExpoData, setEditExpoData] = useState<{ id: string; name: string; venue: string | null; start_date: string; end_date: string; username: string; groups: { id: string; name: string }[] } | null>(null);

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
    username: string; password: string; groups: string[];
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
        setEditExpoData(data);
        setView('edit-expo');
      }
    } catch { /* ignore */ }
  };

  const handleUpdateExpo = async (data: {
    name: string; venue: string; start_date: string; end_date: string;
    username: string; password: string; groups: string[];
  }) => {
    if (!editExpoData) return;

    const updateBody: Record<string, unknown> = {
      name: data.name,
      venue: data.venue,
      start_date: data.start_date,
      end_date: data.end_date,
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
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>;
  }

  if (view === 'login') {
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
            <p className="text-gray-500 text-sm mt-1">Expo Management Dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50" autoComplete="off" />
            </div>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50 pr-12" autoComplete="off" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading || !email || !password}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'Checking...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
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
          <div className="px-6 pt-5 pb-2">
            <StatsOverview
              totalExpos={totals.total_expos}
              activeExpos={activeExpos}
              totalVisitors={totals.total_visitors}
              totalPhotos={totals.total_photos}
              totalGroups={totalGroups}
            />
          </div>
          <div className="px-6 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">All Expos</h2>
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
