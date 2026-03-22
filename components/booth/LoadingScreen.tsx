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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        {/* Animated icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-purple-400/20 animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="w-24 h-24 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
            <Wand2 className="w-10 h-10 text-purple-400 animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Transforming You</h2>
        {themeName && (
          <p className="text-purple-300 mb-2 text-sm">Theme: <strong>{themeName}</strong></p>
        )}
        <p className="text-gray-400 mb-8 text-sm">{messages[messageIndex]}</p>

        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs">{Math.round(progress)}% complete</p>

        <div className="flex justify-center gap-1 mt-6">
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
  );
}
