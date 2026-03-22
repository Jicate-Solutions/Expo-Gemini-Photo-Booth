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
  const [form, setForm] = useState<UserInfo>({ name: '', organization: '', email: '', mobile: '' });
  const [errors, setErrors] = useState<Partial<UserInfo>>({});

  const validate = () => {
    const e: Partial<UserInfo> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.mobile.trim()) e.mobile = 'Mobile number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onNext(form);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-lg">Your Details</h1>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 p-8">
        {/* Photo preview */}
        <div className="flex-shrink-0">
          <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-xl shadow-purple-900/30">
            <img src={capturedPhoto} alt="Your photo" className="w-full h-full object-cover" />
          </div>
          <p className="text-center text-gray-400 text-sm mt-3">Your photo is ready ✓</p>
        </div>

        {/* Form */}
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-xl">Tell us about yourself</h2>
              <p className="text-gray-400 text-sm">We need a few details before your transformation</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Full Name *</label>
              <Input
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                autoComplete="off"
                name="booth-name"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-1 block">Organization / Company</label>
              <Input
                placeholder="Your company or institution (optional)"
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                autoComplete="off"
                name="booth-org"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-1 block">Email Address *</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                autoComplete="off"
                name="booth-email"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-1 block">Mobile Number *</label>
              <Input
                type="tel"
                placeholder="+91 90000 00000"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                autoComplete="off"
                name="booth-mobile"
              />
              {errors.mobile && <p className="text-red-400 text-xs mt-1">{errors.mobile}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2 py-6 text-base rounded-xl mt-2"
            >
              Continue to Themes
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
