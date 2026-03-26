'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, User, Search, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserInfo } from '@/types';

interface GroupOption {
  id: string;
  name: string;
}

interface UserInfoScreenProps {
  capturedPhoto: string;
  groups: GroupOption[];
  onNext: (info: UserInfo) => void;
  onBack: () => void;
}

export default function UserInfoScreen({ capturedPhoto, groups, onNext, onBack }: UserInfoScreenProps) {
  const [form, setForm] = useState<UserInfo>({ name: '', mobile: '', group: '', groupId: undefined });
  const [errors, setErrors] = useState<Partial<Record<keyof UserInfo, string>>>({});
  const [groupSearch, setGroupSearch] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const q = groupSearch.toLowerCase();
    return groups.filter(g => g.name.toLowerCase().includes(q));
  }, [groups, groupSearch]);

  const validate = () => {
    const e: Partial<Record<keyof UserInfo, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.mobile.trim()) e.mobile = 'WhatsApp number is required';
    if (!form.group.trim()) e.group = 'Group is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const selectGroup = (g: GroupOption) => {
    setForm({ ...form, group: g.name, groupId: g.id });
    setShowGroupDropdown(false);
    setShowOtherInput(false);
    setGroupSearch('');
  };

  const selectOther = () => {
    setForm({ ...form, group: '', groupId: undefined });
    setShowGroupDropdown(false);
    setShowOtherInput(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onNext(form);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-gray-950 to-gray-950 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-64 h-64 bg-pink-600/8 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-10 flex items-center gap-4 px-4 md:px-6 py-3 md:py-4 border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Your Details</h1>
      </header>

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 p-6 lg:p-8 overflow-y-auto">
        {/* Photo preview */}
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-purple-600/20 blur-xl" />
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-[0_0_40px_rgba(139,92,246,0.25)]">
              <img src={capturedPhoto} alt="Your photo" className="w-full h-full object-cover" />
            </div>
          </div>
          <p className="text-center text-purple-400/70 text-sm mt-3">Your photo is ready</p>
        </div>

        {/* Form */}
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600/30 to-pink-600/20 border border-purple-500/40 rounded-xl flex items-center justify-center shadow-[0_0_14px_rgba(139,92,246,0.2)]">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Tell us about yourself</h2>
                <p className="text-gray-500 text-sm">A few details before your transformation</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Full Name *</label>
                <Input
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50"
                  autoComplete="off"
                  name="booth-name"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">WhatsApp Number *</label>
                <Input
                  type="tel"
                  placeholder="Enter your 10-digit number"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50"
                  autoComplete="off"
                  name="booth-mobile"
                />
                {errors.mobile && <p className="text-red-400 text-xs mt-1">{errors.mobile}</p>}
              </div>

              {/* Group Searchable Dropdown */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Group *</label>

                {groups.length > 0 && !showOtherInput ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                      className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left focus:border-purple-500/50 transition-colors"
                    >
                      <span className={form.group ? 'text-white' : 'text-gray-600'}>
                        {form.group || 'Select your group'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showGroupDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showGroupDropdown && (
                      <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-2 border-b border-white/10">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                              type="text"
                              placeholder="Search groups..."
                              value={groupSearch}
                              onChange={e => setGroupSearch(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredGroups.map(g => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => selectGroup(g)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-purple-500/10 transition-colors"
                            >
                              {form.groupId === g.id ? (
                                <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 flex-shrink-0" />
                              )}
                              <span className="text-white">{g.name}</span>
                            </button>
                          ))}
                          {filteredGroups.length === 0 && (
                            <p className="px-4 py-3 text-sm text-gray-500">No groups found</p>
                          )}
                        </div>
                        <div className="border-t border-white/10">
                          <button
                            type="button"
                            onClick={selectOther}
                            className="w-full px-4 py-2.5 text-sm text-left text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            Other (type your group)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter your group name"
                      value={form.group}
                      onChange={(e) => setForm({ ...form, group: e.target.value, groupId: undefined })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50"
                      autoComplete="off"
                      name="booth-group"
                    />
                    {groups.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setShowOtherInput(false); setForm({ ...form, group: '', groupId: undefined }); }}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        Back to group list
                      </button>
                    )}
                  </div>
                )}
                {errors.group && <p className="text-red-400 text-xs mt-1">{errors.group}</p>}
              </div>

              <div className="relative pt-2">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 blur opacity-40" />
                <Button
                  type="submit"
                  className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white gap-2 py-6 text-base rounded-xl border-0"
                >
                  Continue to Themes
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
