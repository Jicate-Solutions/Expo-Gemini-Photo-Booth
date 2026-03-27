'use client';

import { useState } from 'react';
import { Wand2, Eye, EyeOff, Sparkles, Camera, Zap, Star } from 'lucide-react';
import { BoothSession } from '@/types';

interface BoothLoginScreenProps {
  onLogin: (session: BoothSession) => void;
}

const SHOWCASE = [
  { img: 'https://picsum.photos/seed/medieval/400/500', label: 'Medieval Knight', emoji: '⚔️' },
  { img: 'https://picsum.photos/seed/doctor/400/500', label: 'Surgeon', emoji: '🩺' },
  { img: 'https://picsum.photos/seed/space/400/500', label: 'Astronaut', emoji: '🚀' },
  { img: 'https://picsum.photos/seed/superhero/400/500', label: 'Superhero', emoji: '🦸' },
  { img: 'https://picsum.photos/seed/pilot/400/500', label: 'Pilot', emoji: '✈️' },
  { img: 'https://picsum.photos/seed/viking/400/500', label: 'Viking', emoji: '🪓' },
  { img: 'https://picsum.photos/seed/lawyer/400/500', label: 'Lawyer', emoji: '⚖️' },
  { img: 'https://picsum.photos/seed/kpop/400/500', label: 'K-Pop Star', emoji: '🎤' },
  { img: 'https://picsum.photos/seed/ceo/400/500', label: 'CEO', emoji: '💼' },
  { img: 'https://picsum.photos/seed/wizard/400/500', label: 'Wizard', emoji: '🧙' },
  { img: 'https://picsum.photos/seed/samurai/400/500', label: 'Samurai', emoji: '🗡️' },
  { img: 'https://picsum.photos/seed/royalty/400/500', label: 'Royalty', emoji: '👑' },
];

export default function BoothLoginScreen({ onLogin }: BoothLoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/booth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }
      onLogin(data.session);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex overflow-hidden">

      {/* ── LEFT: Visual Showcase ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Deep background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-gray-950 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

        {/* Animated glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />

        {/* Floating sparkles */}
        {[...Array(12)].map((_, i) => (
          <Sparkles
            key={i}
            className="absolute text-purple-400/25 animate-pulse"
            style={{
              left: `${[8,20,35,55,70,85,12,42,65,78,30,90][i]}%`,
              top: `${[15,40,10,60,25,45,75,85,5,70,55,30][i]}%`,
              width: `${[10,14,8,12,16,9,11,13,8,15,10,12][i]}px`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2.5 + i * 0.3}s`,
            }}
          />
        ))}

        {/* Theme image grid — two columns scrolling */}
        <div className="absolute inset-0 flex gap-3 p-4 overflow-hidden">
          {/* Column 1 — scroll up */}
          <div className="flex-1 flex flex-col gap-3 animate-[scrollUp_20s_linear_infinite]">
            {[...SHOWCASE.slice(0, 6), ...SHOWCASE.slice(0, 6)].map((item, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden flex-shrink-0 h-52 group">
                <img src={item.img} alt={item.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            ))}
          </div>
          {/* Column 2 — scroll down */}
          <div className="flex-1 flex flex-col gap-3 animate-[scrollDown_25s_linear_infinite] mt-[-80px]">
            {[...SHOWCASE.slice(6), ...SHOWCASE.slice(6)].map((item, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden flex-shrink-0 h-52 group">
                <img src={item.img} alt={item.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            ))}
          </div>
        </div>

        {/* Overlay text on top of images */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-10 text-center">
          <div className="bg-black/50 backdrop-blur-sm rounded-3xl px-8 py-8 border border-white/10">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 rounded-full px-4 py-1.5 mb-5 text-xs text-purple-300">
              <Sparkles className="w-3 h-3" />
              AI-Powered Transformation
            </div>
            <h2 className="text-4xl font-black mb-3 leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
                Step Into
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-white bg-clip-text text-transparent">
                Any World
              </span>
            </h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-xs mx-auto">
              Transform into a doctor, superhero, knight, or anything you can imagine — in seconds.
            </p>
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="text-center">
                <div className="text-purple-300 font-black text-2xl">150+</div>
                <div className="text-gray-500">Themes</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-pink-300 font-black text-2xl">5s</div>
                <div className="text-gray-500">Transform</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-blue-300 font-black text-2xl">Free</div>
                <div className="text-gray-500">Download</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Login Form ── */}
      <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col relative">
        {/* Background */}
        <div className="absolute inset-0 bg-gray-950 lg:bg-black/60 lg:backdrop-blur-sm border-l border-white/5" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-transparent to-pink-950/20 pointer-events-none" />

        {/* Mobile background glow */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-purple-950/40 via-gray-950 to-gray-950" />
        <div className="lg:hidden absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-12">

          {/* Mobile floating sparkles */}
          <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <Sparkles key={i} className="absolute text-purple-400/20 animate-pulse"
                style={{
                  left: `${[10,70,30,85,50,20][i]}%`,
                  top: `${[10,20,50,40,80,70][i]}%`,
                  width: '12px',
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>

          {/* Logo area */}
          <div className="text-center mb-8 w-full">
            <h1 className="font-black text-4xl mb-2">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
                Magic Booth
              </span>
            </h1>
            <p className="text-gray-500 text-sm">Sign in to start transforming</p>
          </div>

          {/* Feature pills */}
          <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-400">
              <Camera className="w-3 h-3 text-purple-400" /> Live Camera
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-400">
              <Zap className="w-3 h-3 text-pink-400" /> Instant AI
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-400">
              <Star className="w-3 h-3 text-yellow-400" /> 150+ Themes
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block">Expo Username</label>
              <input
                type="text"
                placeholder="Enter expo username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 outline-none focus:border-purple-500/60 focus:bg-purple-500/5 transition-all"
                autoComplete="off"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 outline-none focus:border-purple-500/60 focus:bg-purple-500/5 transition-all pr-12"
                  autoComplete="off"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-px shadow-2xl shadow-purple-900/50 hover:shadow-purple-600/40 transition-shadow duration-300 disabled:opacity-40 mt-2"
            >
              <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:from-purple-500 group-hover:to-pink-500 rounded-[11px] px-6 py-3.5 transition-all duration-300">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-white font-bold">Signing in...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-white" />
                    <span className="text-white font-bold text-base">Sign In to Booth</span>
                    <Sparkles className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                  </>
                )}
              </div>
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
            </button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <p className="text-gray-700 text-xs">
              Authorised personnel only · Jicate Solutions
            </p>
            <a
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-purple-400 transition-colors"
            >
              Admin Login →
            </a>
          </div>
        </div>
      </div>

      {/* CSS for scroll animations */}
      <style>{`
        @keyframes scrollUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes scrollDown {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
