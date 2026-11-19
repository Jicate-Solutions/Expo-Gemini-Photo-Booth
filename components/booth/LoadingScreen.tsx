'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Wand2, Medal } from 'lucide-react';

const STANDARD_MESSAGES = [
  'Analysing your photo...',
  'Consulting the AI magic...',
  'Crafting your transformation...',
  'Adding finishing touches...',
  'Almost ready...',
];

const MARATHON_MESSAGES = [
  'Reading your selfie...',
  'Lacing up your running shoes...',
  'Putting on your race bib...',
  'Hanging your finisher medal...',
  'Adding the Erode Marathon poster...',
  'Almost at the finish line...',
];

interface LoadingScreenProps {
  themeName: string;
  expoMode?: string;
  userName?: string;
}

export default function LoadingScreen({ themeName, expoMode, userName }: LoadingScreenProps) {
  const isMarathon = expoMode === 'marathon';
  const messages = isMarathon ? MARATHON_MESSAGES : STANDARD_MESSAGES;
  const firstName = (userName || '').trim().split(/\s+/)[0];

  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8, 90));
    }, 600);

    const messageInterval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % messages.length);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [messages.length]);

  // Bright theme: marathon = JKKN green + orange, standard = purple/pink
  const T = isMarathon
    ? {
        page: 'bg-gradient-to-br from-emerald-50 via-white to-orange-50',
        blobA: 'bg-emerald-200/60', blobB: 'bg-orange-200/60',
        ring1: 'border-emerald-300', ring2: 'border-orange-300',
        badge: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
        bar: 'from-emerald-500 via-emerald-400 to-orange-400',
        accent: 'text-emerald-700', sparkle: 'text-orange-400',
      }
    : {
        page: 'bg-gradient-to-br from-purple-50 via-white to-pink-50',
        blobA: 'bg-purple-200/60', blobB: 'bg-pink-200/60',
        ring1: 'border-purple-300', ring2: 'border-pink-300',
        badge: 'from-purple-500 to-pink-600 shadow-purple-500/30',
        bar: 'from-purple-500 via-pink-500 to-purple-400',
        accent: 'text-purple-700', sparkle: 'text-pink-400',
      };

  const Icon = isMarathon ? Medal : Wand2;

  return (
    <div className={`min-h-screen ${T.page} text-slate-900 flex items-center justify-center relative overflow-hidden`}>
      {/* Soft background accents */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${T.blobA} rounded-full blur-3xl animate-pulse`} />
      <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 ${T.blobB} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '1.5s' }} />
      {[...Array(6)].map((_, i) => (
        <Sparkles key={i} className={`absolute ${T.sparkle} opacity-50 animate-pulse`}
          style={{
            left: `${[10, 25, 60, 75, 85, 40][i]}%`,
            top: `${[15, 70, 10, 60, 30, 85][i]}%`,
            width: '14px',
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      <div className="relative z-10 text-center max-w-md px-6 w-full">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl px-8 py-10 sm:px-10 shadow-2xl shadow-slate-300/50">
          {/* Logos — marathon only */}
          {isMarathon && (
            <div className="flex items-center justify-center gap-3 mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marathon/yi-logo.png" alt="Yi Young Indians" className="h-9 w-auto object-contain" />
              <span className="w-px h-7 bg-slate-300" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/jkkn-logo.png" alt="JKKN" className="h-8 w-auto object-contain" />
            </div>
          )}

          {/* Animated icon */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className={`absolute inset-0 rounded-full border-2 ${T.ring1} animate-ping`} />
            <div className={`absolute inset-2 rounded-full border-2 ${T.ring2} animate-ping`} style={{ animationDelay: '0.5s' }} />
            <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${T.badge} shadow-xl flex items-center justify-center`}>
              <Icon className="w-12 h-12 text-white animate-pulse" />
            </div>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
            {isMarathon ? 'Creating Your Poster' : 'Transforming You'}
          </h2>
          {isMarathon ? (
            <p className={`${T.accent} mb-2 text-sm font-semibold`}>
              {firstName ? `Hang tight, ${firstName}! 🏅` : 'Hang tight, runner! 🏅'}
            </p>
          ) : (
            themeName && (
              <p className={`${T.accent} mb-2 text-sm`}>Theme: <strong>{themeName}</strong></p>
            )
          )}
          <p className="text-slate-500 mb-8 text-sm min-h-[1.25rem]">{messages[messageIndex]}</p>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${T.bar} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs font-medium tabular-nums">{Math.round(progress)}% complete</p>

          {isMarathon && (
            <p className="mt-6 text-xs text-slate-400">Takes about 20–30 seconds — please don&apos;t refresh</p>
          )}
        </div>
      </div>
    </div>
  );
}
