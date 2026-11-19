'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExpoInitialData {
  id: string;
  name: string;
  venue: string | null;
  start_date: string;
  end_date: string;
  username: string;
  groups: { id: string; name: string }[];
  mode?: string;
}

interface ExpoFormProps {
  onSave: (data: {
    name: string; venue: string; start_date: string; end_date: string;
    username: string; password: string; groups: string[]; mode: string;
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: ExpoInitialData;
}

export default function ExpoForm({ onSave, onCancel, initialData }: ExpoFormProps) {
  const isEdit = !!initialData;
  const [name, setName] = useState(initialData?.name || '');
  const [venue, setVenue] = useState(initialData?.venue || '');
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [endDate, setEndDate] = useState(initialData?.end_date || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState('');
  const [groups, setGroups] = useState<string[]>(initialData?.groups.map(g => g.name) || []);
  const [mode, setMode] = useState(initialData?.mode || 'standard');
  const [groupInput, setGroupInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addGroup = () => {
    const trimmed = groupInput.trim();
    if (trimmed && !groups.includes(trimmed)) {
      setGroups([...groups, trimmed]);
      setGroupInput('');
    }
  };

  const removeGroup = (g: string) => setGroups(groups.filter(x => x !== g));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate || !username || (!isEdit && !password)) {
      setError('All required fields must be filled');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ name, venue, start_date: startDate, end_date: endDate, username, password, groups, mode });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expo');
    } finally {
      setSaving(false);
    }
  };


  const inputCls =
    'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 h-10 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/15';
  const labelCls = 'text-xs font-semibold text-slate-600 mb-1.5 block';

  const MODES = [
    { value: 'standard', title: 'Standard', desc: 'Fun & Career themes' },
    { value: 'marathon', title: 'Marathon', desc: 'Erode Marathon poster' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 to-white">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{isEdit ? 'Edit Expo' : 'Create New Expo'}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? 'Update the details, mode or password for this expo.' : 'Set up a new booth with its own login and stats.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Details */}
          <section className="space-y-4">
            <div>
              <label className={labelCls}>Expo Name *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. TechFest Chennai 2026" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Venue</label>
              <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Chennai Trade Centre" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start Date *</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>End Date *</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Booth Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {MODES.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={`text-left rounded-xl border px-4 py-3 transition ${
                      mode === m.value
                        ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        mode === m.value ? 'border-emerald-600' : 'border-slate-300'
                      }`}>
                        {mode === m.value && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                      </span>
                      <span className="font-semibold text-sm text-slate-900">{m.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-6">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Credentials */}
          <section className="border-t border-slate-100 pt-5">
            <p className="text-sm font-bold text-slate-900 mb-3">Expo Login Credentials</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Username *</label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. techfest2026"
                  className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-500`} disabled={isEdit} />
              </div>
              <div>
                <label className={labelCls}>{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={isEdit ? 'Leave blank to keep current' : 'Set a strong password'} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Groups */}
          <section className="border-t border-slate-100 pt-5">
            <p className="text-sm font-bold text-slate-900 mb-3">
              Groups <span className="text-slate-400 font-medium">({groups.length})</span>
            </p>
            <div className="flex gap-2 mb-3">
              <Input
                value={groupInput}
                onChange={e => setGroupInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGroup(); } }}
                placeholder="Type group name and press Enter"
                className={`${inputCls} flex-1`}
              />
              <Button type="button" onClick={addGroup} variant="outline" size="icon"
                className="h-10 w-10 bg-white border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {groups.length === 0 && <span className="text-xs text-slate-400">No groups added</span>}
              {groups.map(g => (
                <span key={g} className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full pl-3 pr-1.5 py-1 text-sm">
                  {g}
                  <button type="button" onClick={() => removeGroup(g)}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </section>

          {error && <p className="text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" onClick={onCancel} variant="outline"
              className="flex-1 h-11 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
              Cancel
            </Button>
            <Button type="submit" disabled={saving}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20">
              {saving ? 'Saving...' : isEdit ? 'Update Expo' : 'Create Expo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
