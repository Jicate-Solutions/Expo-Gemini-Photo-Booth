'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserInfo } from '@/types';

interface UserInfoScreenProps {
  capturedPhoto: string;
  onNext: (info: UserInfo) => void;
  onBack: () => void;
}

export default function UserInfoScreen({ capturedPhoto, onNext, onBack }: UserInfoScreenProps) {
  const [form, setForm] = useState<UserInfo>({ name: '', mobile: '', group: '' });
  const [errors, setErrors] = useState<Partial<UserInfo>>({});

  const validate = () => {
    const e: Partial<UserInfo> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.mobile.trim()) e.mobile = 'WhatsApp number is required';
    if (!form.group.trim()) e.group = 'Group is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onNext(form);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Background */}
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
          <p className="text-center text-purple-400/70 text-sm mt-3">✓ Your photo is ready</p>
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

              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Group *</label>
                <Input
                  placeholder="Enter your group"
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50"
                  autoComplete="off"
                  name="booth-group"
                />
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
