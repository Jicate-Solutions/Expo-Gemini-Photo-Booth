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

  // ── MARATHON FULL-SCREEN LAYOUT ──
  if (isMarathon) {
    return (
      <div className="h-screen text-white overflow-hidden relative flex flex-col"
        style={{ background: 'linear-gradient(160deg, #020d07 0%, #062916 40%, #051a0e 70%, #020d07 100%)' }}>

        {/* Background glows */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full blur-3xl opacity-30 animate-pulse"
            style={{ background: 'radial-gradient(circle, #0b6d41, transparent)', animationDuration: '3s' }} />
          <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ background: 'radial-gradient(circle, #ffde59, transparent)', animationDuration: '4s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-10"
            style={{ background: 'radial-gradient(circle, #0f8f56, transparent)' }} />
        </div>


        {/* Top bar */}
        <div className="relative z-30 flex items-center justify-between px-4 py-2 border-b bg-black/40 backdrop-blur-sm"
          style={{ borderColor: 'rgba(11,109,65,0.3)' }}>
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#ffde59' }}>
            🏃 {expoName}
          </span>
          <div className="flex items-center gap-2">
            {onShowStats && (
              <button onClick={onShowStats} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">Stats</button>
            )}
            <button onClick={onLogout} className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">Logout</button>
          </div>
        </div>

        {/* Top finish ribbon stripe */}
        <div className="relative z-10 w-full h-5 flex-shrink-0 flex items-center justify-center"
          style={{ background: 'repeating-linear-gradient(90deg, #0b6d41 0px, #0b6d41 30px, #ffde59 30px, #ffde59 60px)' }}>
          <span className="text-[10px] font-black tracking-[0.3em] uppercase px-4 py-0.5 rounded-full text-white"
            style={{ background: 'rgba(0,0,0,0.5)' }}>🏁 FINISH LINE 🏁</span>
        </div>

        {/* Main centered content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold animate-pulse"
            style={{ background: 'rgba(11,109,65,0.25)', border: '1px solid rgba(255,222,89,0.4)', color: '#ffde59', animationDuration: '3s' }}>
            🏅 &nbsp;AI-Powered Marathon Experience
          </div>

          {/* Headline */}
          <div>
            <h1 className="font-black leading-tight" style={{ fontSize: 'clamp(3rem, 10vw, 5.5rem)' }}>
              <span className="block text-white">Cross The</span>
              <span className="block" style={{ color: '#ffde59', textShadow: '0 0 40px rgba(255,222,89,0.4)' }}>Finish Line!</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed mt-2">
              AI transforms your photo into a <span className="font-semibold" style={{ color: '#ffde59' }}>champion crossing the finish ribbon</span>
            </p>
          </div>

          {/* 3 feature pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {['🎀 Finish Ribbon', '⚡ 5s Transform', '📲 Share Free'].map((label) => (
              <span key={label} className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: 'rgba(11,109,65,0.2)', border: '1px solid rgba(11,109,65,0.4)', color: '#a8e3c9' }}>
                {label}
              </span>
            ))}
          </div>

          {/* BIG CTA Button */}
          <div className="relative w-full max-w-md">
            {/* Pulsing rings */}
            <div className="absolute inset-[-8px] rounded-[32px] opacity-30 animate-ping"
              style={{ border: '2px solid #ffde59', animationDuration: '2s' }} />
            <div className="absolute inset-[-16px] rounded-[38px] opacity-15 animate-ping"
              style={{ border: '2px solid #0b6d41', animationDuration: '2s', animationDelay: '0.5s' }} />
            <div className="absolute inset-0 rounded-3xl blur-2xl opacity-60 animate-pulse"
              style={{ background: 'linear-gradient(90deg, #0b6d41, #ffde59)', animationDuration: '2s' }} />
            <button
              onClick={onOpenCamera}
              className="group relative w-full overflow-hidden rounded-3xl p-[2px] shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(90deg, #ffde59, #0f8f56, #ffde59)' }}
            >
              <div className="relative flex items-center justify-center gap-5 rounded-[22px] px-8 py-7 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #042010, #0b6d41)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
                  style={{ background: 'rgba(255,222,89,0.15)', border: '2px solid rgba(255,222,89,0.5)', boxShadow: '0 0 20px rgba(255,222,89,0.3)' }}>📸</div>
                <div className="text-left">
                  <div className="font-black text-3xl leading-tight" style={{ color: '#ffde59', textShadow: '0 0 20px rgba(255,222,89,0.5)' }}>Open Camera</div>
                  <div className="text-white/60 text-sm mt-1">Tap to create your victory moment</div>
                </div>
              </div>
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
            </button>
          </div>

        </div>

        {/* Bottom finish ribbon stripe */}
        <div className="relative z-10 w-full h-5 flex-shrink-0"
          style={{ background: 'repeating-linear-gradient(90deg, #ffde59 0px, #ffde59 30px, #0b6d41 30px, #0b6d41 60px)', opacity: 0.7 }} />

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
          <span className="font-black text-base bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">Gemini Magic Booth</span>
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
