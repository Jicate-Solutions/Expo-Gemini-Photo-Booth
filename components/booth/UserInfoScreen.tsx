'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, User, Search, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserInfo } from '@/types';
import { TSHIRT_COLORS, RANDOM_COLOR, defaultBottomWear, findTshirtColor, BODY_LOOKS, DEFAULT_BODY_LOOK } from '@/lib/marathonOptions';

/** sessionStorage key for the in-progress details form (survives a page refresh, cleared per visitor) */
export const USER_INFO_DRAFT_KEY = 'booth_userinfo_draft';

function readUserInfoDraft(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(USER_INFO_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as UserInfo) : null;
  } catch {
    return null;
  }
}

interface GroupOption {
  id: string;
  name: string;
}

interface UserInfoScreenProps {
  /** Missing in the marathon flow, where details are filled in before the selfie */
  capturedPhoto?: string;
  /** Prefill (e.g. staff went back from the camera to fix a typo) */
  initialInfo?: UserInfo;
  groups: GroupOption[];
  onNext: (info: UserInfo) => void;
  onBack: () => void;
  expoMode?: string;
}

export default function UserInfoScreen({ capturedPhoto, initialInfo, groups, onNext, onBack, expoMode }: UserInfoScreenProps) {
  const isMarathon = expoMode === 'marathon';
  const [form, setFormState] = useState<UserInfo>(
    () => initialInfo ?? readUserInfoDraft() ?? { name: '', mobile: '', group: '', groupId: undefined, bibNumber: '' },
  );
  // Every keystroke is saved as a draft, so an accidental refresh doesn't wipe what staff typed
  const setForm = (next: UserInfo) => {
    setFormState(next);
    try { sessionStorage.setItem(USER_INFO_DRAFT_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  };
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
    if (!isMarathon && !form.group.trim()) e.group = 'Group is required';
    if (isMarathon) {
      // The poster is sent to this number, so catch typos before the selfie
      const digits = form.mobile.replace(/\D/g, '');
      const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
      if (form.mobile.trim() && local.length !== 10) e.mobile = 'Enter a valid 10-digit WhatsApp number';
      if (!(form.bibNumber || '').trim()) e.bibNumber = 'Bib number is required';
      if (!form.gender) e.gender = 'Please choose Male or Female';
    }
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


  // Bright theme per booth mode: marathon = JKKN green + poster orange, standard = purple/pink
  const T = isMarathon
    ? {
        page: 'bg-gradient-to-br from-emerald-50 via-white to-orange-50',
        blobA: 'bg-emerald-200/50',
        blobB: 'bg-orange-200/50',
        iconTile: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        focus: 'focus-visible:border-emerald-500 focus-visible:ring-emerald-500/15',
        button: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-600/25',
        link: 'text-emerald-700 hover:text-emerald-800',
        check: 'text-emerald-600',
        hover: 'hover:bg-emerald-50',
        ring: 'border-emerald-200',
      }
    : {
        page: 'bg-gradient-to-br from-purple-50 via-white to-pink-50',
        blobA: 'bg-purple-200/50',
        blobB: 'bg-pink-200/50',
        iconTile: 'bg-purple-50 border-purple-100 text-purple-600',
        focus: 'focus-visible:border-purple-500 focus-visible:ring-purple-500/15',
        button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-600/25',
        link: 'text-purple-700 hover:text-purple-800',
        check: 'text-purple-600',
        hover: 'hover:bg-purple-50',
        ring: 'border-purple-200',
      };

  const inputCls = `h-12 bg-white border-slate-200 text-slate-900 text-base placeholder:text-slate-400 rounded-xl ${T.focus}`;
  const labelCls = 'text-sm font-semibold text-slate-700 mb-1.5 block';
  const errCls = 'text-red-600 text-xs mt-1.5 font-medium';

  return (
    <div className={`min-h-screen ${T.page} text-slate-900 flex flex-col`}>
      {/* soft background accents */}
      <div className={`fixed -top-24 -left-24 w-96 h-96 ${T.blobA} rounded-full blur-3xl pointer-events-none`} />
      <div className={`fixed -bottom-24 -right-24 w-96 h-96 ${T.blobB} rounded-full blur-3xl pointer-events-none`} />

      <header className="relative z-10 flex items-center gap-3 px-4 md:px-6 py-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <button onClick={onBack} aria-label="Back"
          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg text-slate-900 tracking-tight">
          {isMarathon ? 'Runner Details' : 'Your Details'}
        </h1>
        {isMarathon && (
          <div className="ml-auto flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marathon/yi-logo.png" alt="Yi Young Indians" className="h-9 w-auto object-contain" />
            <span className="w-px h-7 bg-slate-300" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jkkn-logo.png" alt="JKKN" className="h-8 w-auto object-contain" />
          </div>
        )}
      </header>

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 p-5 sm:p-8 overflow-y-auto">
        {/* Photo preview (not shown in the marathon flow, where the selfie comes after the details) */}
        {capturedPhoto && (
          <div className="flex-shrink-0">
            <div className={`w-48 h-48 rounded-2xl overflow-hidden border-4 border-white shadow-xl ring-1 ${T.ring}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedPhoto} alt="Your photo" className="w-full h-full object-cover" />
            </div>
            <p className="text-center text-slate-500 text-sm mt-3">Your photo is ready</p>
          </div>
        )}

        {/* Form */}
        <div className="w-full max-w-md">
          {isMarathon && (
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                🏃 Erode Marathon 2026
              </span>
            </div>
          )}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/60">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 ${T.iconTile} border rounded-2xl flex items-center justify-center shrink-0`}>
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-slate-900 tracking-tight">
                  {isMarathon ? 'Welcome, runner! 🏅' : 'Tell us about yourself'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {isMarathon ? 'Fill in your details, then take a selfie' : 'A few details before your transformation'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                <Input
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  autoComplete="off"
                  name="booth-name"
                />
                {errors.name && <p className={errCls}>{errors.name}</p>}
              </div>

              {/* Gender — marathon only; picks the poster outfit (male: shorts, female: track pants) */}
              {isMarathon && (
                <div>
                  <label className={labelCls}>Gender <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Gender">
                    {([['male', '👨', 'Male'], ['female', '👩', 'Female']] as const).map(([value, emoji, label]) => {
                      const selected = form.gender === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          // Picking a gender pre-selects its default bottom wear (women: track pants, men: shorts)
                          onClick={() => setForm({ ...form, gender: value, bottomWear: defaultBottomWear(value) })}
                          className={`h-12 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 transition-colors ${
                            selected
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-lg">{emoji}</span> {label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.gender && <p className={errCls}>{errors.gender}</p>}
                </div>
              )}

              {/* Outfit — marathon only: bottom wear + t-shirt colour for the poster */}
              {isMarathon && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div>
                    <label className={labelCls}>Bottom wear</label>
                    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Bottom wear">
                      {([['shorts', '🩳', 'Shorts'], ['track_pants', '👖', 'Track pants']] as const).map(([value, emoji, label]) => {
                        const selected = (form.bottomWear ?? defaultBottomWear(form.gender)) === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setForm({ ...form, bottomWear: value })}
                            className={`h-11 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 transition-colors ${
                              selected
                                ? 'border-emerald-500 bg-white text-emerald-800 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-lg">{emoji}</span> {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>
                      T-shirt colour
                      <span className="ml-2 font-normal text-slate-500">
                        {findTshirtColor(form.tshirtColor)?.label ?? 'Surprise me'}
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="T-shirt colour">
                      {TSHIRT_COLORS.map(c => {
                        const selected = form.tshirtColor === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={c.label}
                            title={c.label}
                            onClick={() => setForm({ ...form, tshirtColor: c.id })}
                            className={`w-10 h-10 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 ${
                              selected ? 'ring-[3px] ring-emerald-500 ring-offset-2 scale-110' : 'ring-1 ring-slate-200'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        );
                      })}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={!findTshirtColor(form.tshirtColor)}
                        onClick={() => setForm({ ...form, tshirtColor: RANDOM_COLOR })}
                        className={`h-10 px-3 rounded-full border-2 text-sm font-semibold transition-colors ${
                          !findTshirtColor(form.tshirtColor)
                            ? 'border-emerald-500 bg-white text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        🎲 Surprise me
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Your finisher look</label>
                    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Finisher look">
                      {BODY_LOOKS.map(look => {
                        const selected = (form.bodyLook ?? DEFAULT_BODY_LOOK) === look.id;
                        return (
                          <button
                            key={look.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setForm({ ...form, bodyLook: look.id })}
                            className={`py-2.5 rounded-xl border-2 flex flex-col items-center justify-center transition-colors ${
                              selected
                                ? 'border-emerald-500 bg-white text-emerald-800 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span className="font-semibold flex items-center gap-1.5"><span className="text-lg">{look.emoji}</span> {look.label}</span>
                            <span className={`text-xs ${selected ? 'text-emerald-700/80' : 'text-slate-400'}`}>{look.hint}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Bib number — marathon only; printed on the poster's race bib */}
              {isMarathon && (
                <div>
                  <label className={labelCls}>Bib Number <span className="text-red-500">*</span></label>
                  <Input
                    inputMode="numeric"
                    placeholder="e.g. 1002"
                    maxLength={8}
                    value={form.bibNumber || ''}
                    onChange={(e) => setForm({ ...form, bibNumber: e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase() })}
                    className={`${inputCls} font-bold tracking-widest`}
                    autoComplete="off"
                    name="booth-bib"
                  />
                  {errors.bibNumber && <p className={errCls}>{errors.bibNumber}</p>}
                </div>
              )}

              <div>
                <label className={labelCls}>WhatsApp Number <span className="text-red-500">*</span></label>
                <Input
                  type="tel"
                  placeholder="Enter your 10-digit number"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className={inputCls}
                  autoComplete="off"
                  name="booth-mobile"
                />
                {errors.mobile && <p className={errCls}>{errors.mobile}</p>}
                {isMarathon && !errors.mobile && (
                  <p className="text-slate-400 text-xs mt-1.5">Your poster will be sent to this number</p>
                )}
              </div>

              {/* Group Searchable Dropdown — hidden for marathon */}
              {!isMarathon && <div>
                <label className={labelCls}>Group <span className="text-red-500">*</span></label>

                {groups.length > 0 && !showOtherInput ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                      className="w-full h-12 flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 text-left hover:border-slate-300 transition-colors"
                    >
                      <span className={form.group ? 'text-slate-900' : 'text-slate-400'}>
                        {form.group || 'Select your group'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showGroupDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showGroupDropdown && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/70 overflow-hidden">
                        <div className="p-2 border-b border-slate-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search groups..."
                              value={groupSearch}
                              onChange={e => setGroupSearch(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-purple-400"
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
                              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left ${T.hover} transition-colors`}
                            >
                              {form.groupId === g.id ? (
                                <Check className={`w-4 h-4 ${T.check} flex-shrink-0`} />
                              ) : (
                                <div className="w-4 h-4 flex-shrink-0" />
                              )}
                              <span className="text-slate-800">{g.name}</span>
                            </button>
                          ))}
                          {filteredGroups.length === 0 && (
                            <p className="px-4 py-3 text-sm text-slate-500">No groups found</p>
                          )}
                        </div>
                        <div className="border-t border-slate-100">
                          <button
                            type="button"
                            onClick={selectOther}
                            className="w-full px-4 py-2.5 text-sm text-left text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
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
                      className={inputCls}
                      autoComplete="off"
                      name="booth-group"
                    />
                    {groups.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setShowOtherInput(false); setForm({ ...form, group: '', groupId: undefined }); }}
                        className={`text-xs font-medium ${T.link}`}
                      >
                        Back to group list
                      </button>
                    )}
                  </div>
                )}
                {errors.group && <p className={errCls}>{errors.group}</p>}
              </div>}

              <div className="pt-2">
                <Button
                  type="submit"
                  className={`w-full ${T.button} text-white font-bold gap-2 h-14 text-base rounded-xl border-0 shadow-lg`}
                >
                  {isMarathon ? 'Continue to Selfie 📸' : 'Continue to Themes'}
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
