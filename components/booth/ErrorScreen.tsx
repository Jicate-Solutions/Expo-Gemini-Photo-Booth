'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorScreenProps {
  message: string;
  onStartOver: () => void;
}

export default function ErrorScreen({ message, onStartOver }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-red-950/20 to-gray-950 text-white flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        <div className="w-20 h-20 bg-red-900/30 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">{message}</p>
        <Button
          onClick={onStartOver}
          className="bg-purple-600 hover:bg-purple-700 gap-2 px-8 py-5"
        >
          <RotateCcw className="w-5 h-5" />
          Start Over
        </Button>
      </div>
    </div>
  );
}
