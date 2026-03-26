'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import ExpoList from '@/components/admin/ExpoList';
import ExpoForm from '@/components/admin/ExpoForm';
import ExpoDetail from '@/components/admin/ExpoDetail';
import { ExpoOverview } from '@/types';

type AdminView = 'login' | 'expos' | 'create-expo' | 'edit-expo' | 'expo-detail';

export default function AdminPage() {
  const [view, setView] = useState<AdminView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState('');
  const [expos, setExpos] = useState<ExpoOverview[]>([]);
  const [selectedExpoId, setSelectedExpoId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editExpoData, setEditExpoData] = useState<{ id: string; name: string; venue: string | null; start_date: string; end_date: string; username: string; groups: { id: string; name: string }[] } | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) {
      setAdminToken(saved);
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
      sessionStorage.setItem('admin_token', token);
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
    setAdminToken('');
    setView('login');
    setExpos([]);
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

    // Update expo details
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

    // Sync groups: add any new ones
    const existingNames = editExpoData.groups.map(g => g.name);
    const newGroups = data.groups.filter(g => !existingNames.includes(g));
    if (newGroups.length > 0) {
      await fetch(`/api/expos/${editExpoData.id}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: newGroups }),
      });
    }

    // Remove groups that were deleted
    const removedGroups = editExpoData.groups.filter(g => !data.groups.includes(g.name));
    for (const g of removedGroups) {
      await fetch(`/api/expos/${editExpoData.id}/groups`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: g.id }),
      });
    }

    // Immediately update local state so UI reflects changes instantly
    setExpos(prev => prev.map(e => e.id === editExpoData.id ? {
      ...e,
      name: data.name,
      venue: data.venue,
      start_date: data.start_date,
      end_date: data.end_date,
    } : e));

    setEditExpoData(null);
    setView('expos');
    // Also refresh from server in background
    fetchExpos();
  };

  const handleDeleteExpo = async (expoId: string) => {
    try {
      const res = await fetch(`/api/expos/${expoId}`, { method: 'DELETE' });
      if (res.ok) {
        // Immediately update local state to reflect the change
        setExpos(prev => prev.map(e => e.id === expoId ? { ...e, is_active: false } : e));
        setSelectedExpoId(null);
        setView('expos');
        // Also refresh from server for consistency
        await fetchExpos();
      } else {
        const err = await res.json();
        alert('Failed to deactivate: ' + (err.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Error: ' + String(e));
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
        await fetchExpos();
      }
    } catch { /* ignore */ }
  };

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
          <AdminHeader title="Expo Dashboard" subtitle={`${expos.length} expos total`}
            onLogout={handleLogout} onRefresh={handleRefresh} onCreateExpo={() => setView('create-expo')} refreshing={refreshing} />
          <ExpoList expos={expos} onSelect={(id) => { setSelectedExpoId(id); setView('expo-detail'); }} onReactivate={handleReactivateExpo} />
        </>
      )}
      {view === 'create-expo' && (
        <>
          <AdminHeader title="Create Expo" onLogout={handleLogout} onBack={() => setView('expos')} />
          <ExpoForm onSave={handleCreateExpo} onCancel={() => setView('expos')} />
        </>
      )}
      {view === 'edit-expo' && editExpoData && (
        <>
          <AdminHeader title={`Edit: ${editExpoData.name}`} onLogout={handleLogout} onBack={() => { setEditExpoData(null); setView('expo-detail'); }} />
          <ExpoForm onSave={handleUpdateExpo} onCancel={() => { setEditExpoData(null); setView('expo-detail'); }} initialData={editExpoData} />
        </>
      )}
      {view === 'expo-detail' && selectedExpoId && (
        <>
          <AdminHeader title={expos.find(e => e.id === selectedExpoId)?.name || 'Expo Detail'}
            onLogout={handleLogout} onBack={() => setView('expos')} />
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
