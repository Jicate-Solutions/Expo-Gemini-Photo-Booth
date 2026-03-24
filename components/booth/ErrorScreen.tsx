'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorScreenProps {
  message: string;
  onStartOver: () => void;
}

export default function ErrorScreen({ message, onStartOver }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-gray-950 to-gray-950" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-600/8 rounded-full blur-3xl" />
      <div className="relative z-10 text-center max-w-md px-6 w-full">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-10 shadow-[0_0_60px_rgba(0,0,0,0.4)]">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-red-600/20 blur-xl" />
            <div className="relative w-20 h-20 bg-red-900/30 border border-red-500/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-black mb-3 bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">Something went wrong</h2>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">{message}</p>
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 blur opacity-40" />
            <Button
              onClick={onStartOver}
              className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 gap-2 py-5 border-0"
            >
              <RotateCcw className="w-5 h-5" />
              Start Over
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
