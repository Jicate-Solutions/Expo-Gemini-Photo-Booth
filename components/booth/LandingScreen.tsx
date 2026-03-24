'use client';

import { useRef } from 'react';
import { Camera, Sparkles, Wand2, Briefcase, Star, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { funThemes } from '@/lib/themes';
import { careerThemes } from '@/lib/career-themes';

interface LandingScreenProps {
  onOpenCamera: () => void;
  onPhotoUpload: (photo: string) => void;
}

export default function LandingScreen({ onOpenCamera, onPhotoUpload }: LandingScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPhotoUpload(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Pick visually varied themes for showcase (funThemes has indices 0–50)
  const funShowcase = [
    funThemes[0],  // Medieval Knight
    funThemes[5],  // Fairytale Royal
    funThemes[12], // Spartan Warrior
    funThemes[19], // Comic Book Hero
    funThemes[24], // Space Explorer
    funThemes[32], // Bollywood Star
    funThemes[38], // Tango Master
    funThemes[43], // Superman
    funThemes[46], // Thor
  ];

  const careerShowcase = [
    careerThemes[0],  // Doctor
    careerThemes[1],  // Surgeon
    careerThemes[10], // Software Engineer
    careerThemes[20], // Lawyer
    careerThemes[27], // CEO
    careerThemes[37], // Pilot
    careerThemes[40], // Astronaut
    careerThemes[57], // Chef
    careerThemes[74], // Firefighter
  ].filter(Boolean).slice(0, 9);

  const ThemeCard = ({ theme }: { theme: typeof funThemes[0] }) => (
    <div className="relative rounded-xl overflow-hidden h-full group cursor-default">
      <img
        src={theme.bgImage}
        alt={theme.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-1.5">
        <span className="text-sm leading-none">{theme.emoji}</span>
        <p className="text-white font-bold text-[9px] uppercase tracking-wide leading-tight mt-0.5 line-clamp-1">
          {theme.title.replace(/[^\w\s]/g, '').trim()}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-base text-purple-300">Gemini Magic Booth</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>150+ Themes · AI-Powered</span>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:h-[calc(100vh-49px)] overflow-y-auto md:overflow-hidden">

        {/* ── LEFT / TOP on mobile: Hero ── */}
        <div className="w-full md:w-[340px] md:flex-shrink-0 flex flex-col items-center justify-center px-8 py-10 md:py-0 relative md:border-r border-white/5">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/60 via-gray-950 to-gray-950 pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Floating sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <Sparkles
                key={i}
                className="absolute text-purple-400/30 animate-pulse"
                style={{
                  left: `${[15, 70, 30, 85, 10, 60, 45, 80][i]}%`,
                  top: `${[10, 20, 40, 15, 60, 70, 85, 50][i]}%`,
                  width: `${[10, 14, 8, 12, 16, 10, 8, 12][i]}px`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: `${2.5 + i * 0.3}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-purple-900/50 border border-purple-500/40 rounded-full px-3 py-1 mb-5 text-xs text-purple-300">
              <Sparkles className="w-3 h-3" />
              AI-Powered Transformation
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-black mb-3 leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                Step Into
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-white bg-clip-text text-transparent">
                Any World
              </span>
            </h1>

            <p className="text-gray-400 text-sm mb-2 leading-relaxed">
              Take a photo and watch AI transform you into a doctor, superhero, knight — anything!
            </p>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-4 mb-7 text-xs">
              <div className="text-center">
                <div className="text-purple-300 font-bold text-base">150+</div>
                <div className="text-gray-500">Themes</div>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <div className="text-pink-300 font-bold text-base">5s</div>
                <div className="text-gray-500">Transform</div>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <div className="text-blue-300 font-bold text-base">Free</div>
                <div className="text-gray-500">Download</div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={onOpenCamera}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-px shadow-2xl shadow-purple-900/50 hover:shadow-purple-600/40 transition-shadow duration-300"
            >
              <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:from-purple-500 group-hover:to-pink-500 rounded-[15px] px-6 py-4 transition-all duration-300">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-white font-black text-base leading-tight">Open Camera</div>
                  <div className="text-white/70 text-xs">Take your photo now</div>
                </div>
                <Sparkles className="w-4 h-4 text-white/60 ml-auto group-hover:text-white/90 transition-colors" />
              </div>
              {/* Shine effect */}
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
            </button>

            <p className="text-gray-600 text-xs mt-4">
              ✓ Free · ✓ Instant · ✓ No sign-up needed
            </p>

            <a
              href="/admin"
              className="mt-3 inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-400 text-xs transition-colors"
            >
              <Lock className="w-3 h-3" />
              Admin Dashboard
            </a>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* ── Mobile only: compact theme preview strip ── */}
        <div className="md:hidden px-4 pb-8 space-y-5">
          {/* Career preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-sky-300 flex items-center gap-1.5">💼 Career Themes</span>
              <span className="text-[10px] text-sky-400 bg-sky-500/15 border border-sky-500/20 px-2 py-0.5 rounded-full font-semibold">95+ ROLES</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {careerShowcase.map((theme) => (
                <div key={theme.id} className="relative flex-shrink-0 w-20 h-28 rounded-xl overflow-hidden">
                  <img src={theme.bgImage} alt={theme.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <span className="text-sm leading-none">{theme.emoji}</span>
                    <p className="text-white font-bold text-[8px] uppercase tracking-wide leading-tight mt-0.5 line-clamp-1">{theme.title.replace(/[^\w\s]/g, '').trim()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Fun preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-violet-300 flex items-center gap-1.5">✨ Fun &amp; Fantasy</span>
              <span className="text-[10px] text-violet-400 bg-violet-500/15 border border-violet-500/20 px-2 py-0.5 rounded-full font-semibold">60+ THEMES</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {funShowcase.map((theme) => (
                <div key={theme.id} className="relative flex-shrink-0 w-20 h-28 rounded-xl overflow-hidden">
                  <img src={theme.bgImage} alt={theme.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <span className="text-sm leading-none">{theme.emoji}</span>
                    <p className="text-white font-bold text-[8px] uppercase tracking-wide leading-tight mt-0.5 line-clamp-1">{theme.title.replace(/[^\w\s]/g, '').trim()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Theme Showcase (two columns) — desktop only ── */}
        <div className="hidden md:flex flex-1 overflow-hidden">

          {/* ── CAREER THEMES ── */}
          <div className="flex-1 flex flex-col overflow-hidden relative"
            style={{ background: 'linear-gradient(160deg, rgba(14,165,233,0.13) 0%, #030912 45%)' }}>

            {/* Top colour bar */}
            <div className="h-1 flex-shrink-0 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400" />

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3"
              style={{ background: 'linear-gradient(90deg,rgba(14,165,233,0.18),rgba(37,99,235,0.08))', borderBottom: '1px solid rgba(14,165,233,0.18)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(14,165,233,0.45)', boxShadow: '0 0 14px rgba(14,165,233,0.25)' }}>
                  <Briefcase style={{ width: 18, height: 18, color: '#38bdf8' }} />
                </div>
                <div>
                  <p className="text-white font-bold text-base leading-none tracking-tight">Career Themes</p>
                  <p className="text-sky-400/70 text-[11px] mt-0.5">Doctor · Engineer · Pilot · CEO</p>
                </div>
              </div>
              {/* Bold count */}
              <div className="text-right flex-shrink-0">
                <div className="text-sky-300 font-black text-3xl leading-none" style={{ textShadow: '0 0 20px rgba(56,189,248,0.6)' }}>95+</div>
                <div className="text-sky-500/60 text-[9px] uppercase tracking-widest font-semibold">Roles</div>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 grid-rows-3 gap-1.5 flex-1 min-h-0 p-2.5">
              {careerShowcase.map((theme) => (
                <ThemeCard key={theme.id} theme={theme} />
              ))}
            </div>

            {/* Footer strip */}
            <div className="flex-shrink-0 py-2 text-center"
              style={{ background: 'rgba(14,165,233,0.07)', borderTop: '1px solid rgba(14,165,233,0.15)' }}>
              <span className="text-sky-400/60 text-[10px] tracking-widest uppercase font-semibold">
                Transform into your dream profession
              </span>
            </div>
          </div>

          {/* Divider — glowing seam */}
          <div className="w-[2px] flex-shrink-0"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(14,165,233,0.6) 30%, rgba(139,92,246,0.6) 70%, transparent)', boxShadow: '0 0 12px rgba(139,92,246,0.35)' }} />

          {/* ── FUN THEMES ── */}
          <div className="flex-1 flex flex-col overflow-hidden relative"
            style={{ background: 'linear-gradient(160deg, rgba(139,92,246,0.13) 0%, #060312 45%)' }}>

            {/* Top colour bar */}
            <div className="h-1 flex-shrink-0 bg-gradient-to-r from-violet-400 via-purple-500 to-violet-400" />

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3"
              style={{ background: 'linear-gradient(90deg,rgba(139,92,246,0.18),rgba(109,40,217,0.08))', borderBottom: '1px solid rgba(139,92,246,0.18)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.45)', boxShadow: '0 0 14px rgba(139,92,246,0.25)' }}>
                  <Star style={{ width: 18, height: 18, color: '#a78bfa' }} />
                </div>
                <div>
                  <p className="text-white font-bold text-base leading-none tracking-tight">Fun & Fantasy</p>
                  <p className="text-violet-400/70 text-[11px] mt-0.5">Knight · Superhero · Viking · K-Pop</p>
                </div>
              </div>
              {/* Bold count */}
              <div className="text-right flex-shrink-0">
                <div className="text-violet-300 font-black text-3xl leading-none" style={{ textShadow: '0 0 20px rgba(167,139,250,0.6)' }}>60+</div>
                <div className="text-violet-500/60 text-[9px] uppercase tracking-widest font-semibold">Themes</div>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 grid-rows-3 gap-1.5 flex-1 min-h-0 p-2.5">
              {funShowcase.map((theme) => (
                <ThemeCard key={theme.id} theme={theme} />
              ))}
            </div>

            {/* Footer strip */}
            <div className="flex-shrink-0 py-2 text-center"
              style={{ background: 'rgba(139,92,246,0.07)', borderTop: '1px solid rgba(139,92,246,0.15)' }}>
              <span className="text-violet-400/60 text-[10px] tracking-widest uppercase font-semibold">
                Become a legend, hero or royalty
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
