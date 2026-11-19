'use client';

import { useRef } from 'react';
import { Camera, Sparkles, Wand2, Briefcase, Star, Lock, LogOut, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { funThemes } from '@/lib/themes';
import { careerThemes } from '@/lib/career-themes';

interface LandingScreenProps {
  onOpenCamera: () => void;
  onPhotoUpload: (photo: string) => void;
  onLogout: () => void;
  expoName?: string;
  onShowStats?: () => void;
  expoMode?: string;
}

export default function LandingScreen({ onOpenCamera, onPhotoUpload, onLogout, expoName, onShowStats, expoMode }: LandingScreenProps) {
  const isMarathon = expoMode === 'marathon';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showInstallButton, hasNativePrompt, isIOS, promptInstall } = usePWAInstall();

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

  // ── MARATHON LANDING (bright, stall-friendly) ──
  if (isMarathon) {
    const steps = [
      { n: 1, icon: '📝', title: 'Your details', desc: 'Name, bib & WhatsApp' },
      { n: 2, icon: '🤳', title: 'Take a selfie', desc: 'Smile for the camera' },
      { n: 3, icon: '🏅', title: 'Get your poster', desc: 'Sent to your WhatsApp' },
    ];

    return (
      <div className="min-h-screen lg:h-screen text-slate-900 relative flex flex-col overflow-x-hidden bg-gradient-to-br from-emerald-50 via-white to-orange-50">
        {/* soft background accents */}
        <div className="fixed -top-32 -left-32 w-[28rem] h-[28rem] bg-emerald-200/50 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed -bottom-32 -right-32 w-[28rem] h-[28rem] bg-orange-200/50 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar */}
        <header className="relative z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marathon/yi-logo.png" alt="Yi Young Indians" className="h-9 w-auto object-contain" />
            <span className="w-px h-7 bg-slate-300" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jkkn-logo.png" alt="JKKN" className="h-8 w-auto object-contain" />
            {expoName && (
              <span className="hidden sm:inline-flex ml-2 items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {expoName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onShowStats && (
              <button onClick={onShowStats}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                Stats
              </button>
            )}
            <button onClick={onLogout}
              className="text-sm font-medium text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              Logout
            </button>
          </div>
        </header>

        {/* Finish-line strip */}
        <div className="relative z-10 h-1.5 w-full flex-shrink-0"
          style={{ background: 'repeating-linear-gradient(90deg, #0b6d41 0 24px, #f97316 24px 48px, #ffffff 48px 72px)' }} />

        {/* Main */}
        <main className="relative z-10 flex-1 min-h-0 w-full max-w-6xl mx-auto px-5 sm:px-8 py-8 lg:py-6 grid lg:grid-cols-[1.15fr_0.85fr] items-center gap-10 lg:gap-14">
          {/* Left: message + CTA */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
              🏃 Erode Marathon 2026
            </span>

            <h1 className="mt-5 font-black tracking-tight leading-[1.02]" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}>
              <span className="block text-slate-900">You crossed the</span>
              <span className="block bg-gradient-to-r from-emerald-600 via-emerald-500 to-orange-500 bg-clip-text text-transparent pb-1">
                finish line!
              </span>
            </h1>

            <p className="mt-4 text-slate-600 text-base sm:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Get your personalised <b className="text-slate-900">AI finisher poster</b> with your bib number —
              sent straight to your WhatsApp.
            </p>
            <p className="mt-2 text-sm font-semibold text-orange-600">I choose a drug-free life! 💪</p>

            {/* How it works */}
            <div className="mt-7 grid grid-cols-3 gap-2.5 sm:gap-3 max-w-lg mx-auto lg:mx-0">
              {steps.map(s => (
                <div key={s.n} className="relative bg-white/90 border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-sm text-left">
                  <span className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {s.n}
                  </span>
                  <div className="text-2xl leading-none">{s.icon}</div>
                  <div className="mt-2 text-sm font-bold text-slate-900 leading-tight">{s.title}</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 leading-snug mt-0.5">{s.desc}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 max-w-lg mx-auto lg:mx-0">
              <button
                onClick={onOpenCamera}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-xl shadow-emerald-600/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-center gap-4 px-6 py-5">
                  <div className="w-14 h-14 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-black text-2xl leading-tight">Get My Poster</div>
                    <div className="text-white/80 text-sm">Takes less than a minute</div>
                  </div>
                  <span className="text-2xl transition-transform group-hover:translate-x-1">→</span>
                </div>
                {/* shine sweep */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none" />
              </button>

              <button
                onClick={() => (window.location.href = '/admin')}
                className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
              >
                Admin Dashboard
              </button>
            </div>
          </div>

          {/* Right: sample poster */}
          <div className="relative mx-auto w-full max-w-[18rem] sm:max-w-xs lg:max-w-[22rem] lg:h-full lg:max-h-[78vh] flex items-center">
            <div className="absolute inset-6 bg-gradient-to-br from-emerald-300/60 to-orange-300/60 rounded-[2rem] blur-2xl" />
            <div className="relative w-full rotate-[2deg] hover:rotate-0 transition-transform duration-500">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marathon/sample-poster.jpg" alt="Sample Erode Marathon finisher poster"
                className="w-full h-auto lg:max-h-[74vh] object-contain rounded-3xl border-[6px] border-white shadow-2xl bg-white" />
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                ✨ Sample poster
              </span>
            </div>
          </div>
        </main>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">

      {expoName && (
        <div className="relative z-30 flex items-center justify-between px-4 py-2 bg-black/50 backdrop-blur-sm border-b border-white/10">
          <span className="text-xs text-purple-300 font-medium truncate">
            Active: {expoName}
          </span>
          <div className="flex items-center gap-2">
            {onShowStats && (
              <button onClick={onShowStats} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
                Stats
              </button>
            )}
            {onLogout && (
              <button onClick={onLogout} className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
                Logout
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global background glows */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-gray-950 to-black pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/8 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-purple-500/30 to-pink-500/20 border border-purple-500/40 rounded-lg flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-purple-300" />
          </div>
          <span className="font-black text-base bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">Magic Booth</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 text-xs text-purple-300">
            <Sparkles className="w-3 h-3" />
            150+ Themes · AI-Powered
          </div>
          {showInstallButton && (
            <button
              onClick={() => {
                if (hasNativePrompt) {
                  promptInstall();
                } else if (isIOS) {
                  alert('To install: tap the Share button (⎋) then "Add to Home Screen"');
                } else {
                  alert('To install: click the install icon (⊕) in your browser\'s address bar');
                }
              }}
              className="flex items-center gap-1.5 text-purple-300 hover:text-white text-xs transition-colors px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 flex flex-col md:flex-row md:h-[calc(100vh-49px)] overflow-y-auto md:overflow-hidden">

        {/* ── LEFT / TOP on mobile: Hero ── */}
        <div className="w-full md:w-[360px] md:flex-shrink-0 flex flex-col items-center justify-center px-8 py-10 md:py-0 relative md:border-r border-white/5">

          {/* Floating sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <Sparkles key={i} className="absolute text-purple-400/20 animate-pulse"
                style={{
                  left: `${[15,70,30,85,10,60,45,80][i]}%`,
                  top: `${[10,20,40,15,60,70,85,50][i]}%`,
                  width: `${[10,14,8,12,16,10,8,12][i]}px`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: `${2.5 + i * 0.3}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 text-center w-full">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 mb-6 text-xs text-orange-300">
              <Sparkles className="w-3 h-3" />
              {isMarathon ? 'Marathon Finish Line Experience' : 'AI-Powered Transformation'}
            </div>

            {/* Headline */}
            <h1 className="text-5xl font-black mb-4 leading-tight">
              {isMarathon ? (
                <>
                  <span className="bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">
                    Cross The
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-orange-400 via-yellow-300 to-white bg-clip-text text-transparent">
                    Finish Line!
                  </span>
                </>
              ) : (
                <>
                  <span className="bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                    Step Into
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-white bg-clip-text text-transparent">
                    Any World
                  </span>
                </>
              )}
            </h1>

            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              {isMarathon
                ? 'Take a photo and AI will transform you into a champion crossing the marathon finish line!'
                : 'Take a photo and watch AI transform you into a doctor, superhero, knight — anything!'}
            </p>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-4 mb-8 text-xs">
              {isMarathon ? (
                <>
                  <div className="text-center bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                    <div className="text-orange-300 font-black text-xl">🏅</div>
                    <div className="text-gray-500">Finish Line</div>
                  </div>
                  <div className="text-center bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                    <div className="text-yellow-300 font-black text-xl">5s</div>
                    <div className="text-gray-500">Transform</div>
                  </div>
                  <div className="text-center bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                    <div className="text-blue-300 font-black text-xl">Free</div>
                    <div className="text-gray-500">Download</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                    <div className="text-purple-300 font-black text-xl" style={{ textShadow: '0 0 20px rgba(167,139,250,0.5)' }}>150+</div>
                    <div className="text-gray-500">Themes</div>
                  </div>
                  <div className="text-center bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                    <div className="text-pink-300 font-black text-xl" style={{ textShadow: '0 0 20px rgba(236,72,153,0.5)' }}>5s</div>
                    <div className="text-gray-500">Transform</div>
                  </div>
                  <div className="text-center bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                    <div className="text-blue-300 font-black text-xl" style={{ textShadow: '0 0 20px rgba(147,197,253,0.5)' }}>Free</div>
                    <div className="text-gray-500">Download</div>
                  </div>
                </>
              )}
            </div>

            {/* CTA Button */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 blur-xl opacity-50 animate-pulse" />
              <button
                onClick={onOpenCamera}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-px shadow-2xl shadow-purple-900/50 hover:shadow-purple-500/50 transition-shadow duration-300"
              >
                <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:from-purple-500 group-hover:to-pink-500 rounded-[15px] px-6 py-4 transition-all duration-300">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-black text-base leading-tight">Open Camera</div>
                    <div className="text-white/70 text-xs">Take your photo now</div>
                  </div>
                  <Sparkles className="w-4 h-4 text-white/60 ml-auto group-hover:text-white transition-colors" />
                </div>
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12" />
              </button>
            </div>

            <p className="text-gray-600 text-xs mt-4">✓ Free · ✓ Instant · ✓ No sign-up needed</p>

            <a href="/admin" className="mt-3 inline-flex items-center gap-1.5 text-gray-700 hover:text-gray-400 text-xs transition-colors">
              <Lock className="w-3 h-3" />
              Admin Dashboard
            </a>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* ── Mobile only: compact theme preview strip ── */}
        <div className={`md:hidden px-4 pb-8 space-y-5 ${isMarathon ? 'hidden' : ''}`}>
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
        <div className={`flex-1 overflow-hidden ${isMarathon ? 'hidden' : 'hidden md:flex'}`}>

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
