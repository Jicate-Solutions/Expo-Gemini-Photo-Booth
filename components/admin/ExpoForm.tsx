'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExpoFormProps {
  onSave: (data: {
    name: string; venue: string; start_date: string; end_date: string;
    username: string; password: string; groups: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ExpoForm({ onSave, onCancel }: ExpoFormProps) {
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
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
    if (!name || !startDate || !endDate || !username || !password) {
      setError('All required fields must be filled');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ name, venue, start_date: startDate, end_date: endDate, username, password, groups });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Create New Expo</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Expo Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. TechFest Chennai 2026"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Venue</label>
            <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Chennai Trade Centre"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Start Date *</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">End Date *</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-sm font-semibold text-white mb-3">Expo Login Credentials</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Username *</label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. techfest2026"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Password *</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Set a strong password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-sm font-semibold text-white mb-3">Groups ({groups.length})</p>
            <div className="flex gap-2 mb-3">
              <Input
                value={groupInput}
                onChange={e => setGroupInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGroup(); } }}
                placeholder="Type group name and press Enter"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 flex-1"
              />
              <Button type="button" onClick={addGroup} variant="outline" size="icon"
                className="border-white/10 text-gray-400 hover:text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <span key={g} className="inline-flex items-center gap-1.5 bg-purple-500/15 text-purple-300 border border-purple-500/20 rounded-full px-3 py-1 text-sm">
                  {g}
                  <button type="button" onClick={() => removeGroup(g)} className="text-purple-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={onCancel} variant="outline"
              className="flex-1 border-white/10 text-gray-400 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={saving}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white">
              {saving ? 'Creating...' : 'Create Expo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
