'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';

const messages = [
  'Analysing your photo...',
  'Consulting the AI magic...',
  'Crafting your transformation...',
  'Adding finishing touches...',
  'Almost ready...',
];

interface LoadingScreenProps {
  themeName: string;
}

export default function LoadingScreen({ themeName }: LoadingScreenProps) {
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
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-gray-950 to-gray-950" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      {[...Array(6)].map((_, i) => (
        <Sparkles key={i} className="absolute text-purple-400/20 animate-pulse"
          style={{
            left: `${[10,25,60,75,85,40][i]}%`,
            top: `${[15,70,10,60,30,85][i]}%`,
            width: '12px',
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      <div className="relative z-10 text-center max-w-md px-6 w-full">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-10 shadow-[0_0_60px_rgba(139,92,246,0.1)]">
          {/* Animated icon */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-pink-400/20 animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/10 blur-xl animate-pulse" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/10 border border-purple-500/40 flex items-center justify-center">
              <Wand2 className="w-12 h-12 text-purple-300 animate-pulse" />
            </div>
          </div>

          <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">Transforming You</h2>
          {themeName && (
            <p className="text-purple-300 mb-2 text-sm">Theme: <strong>{themeName}</strong></p>
          )}
          <p className="text-gray-400 mb-8 text-sm">{messages[messageIndex]}</p>

          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-2.5 mb-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs mb-6">{Math.round(progress)}% complete</p>

          <div className="flex justify-center gap-2">
            {[...Array(4)].map((_, i) => (
              <Sparkles
                key={i}
                className="w-4 h-4 text-purple-400 animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
