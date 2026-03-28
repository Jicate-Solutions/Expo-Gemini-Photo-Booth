'use client';

import { useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function InstallPrompt() {
  const { canInstall, showIOSGuide, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('pwa-install-dismissed') === '1';
    return false;
  });

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', '1');
  }

  if (dismissed) return null;

  // iOS: show share-sheet instruction
  if (showIOSGuide) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <div className="relative bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl shadow-purple-500/10">
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex-shrink-0">
              <Share className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Install Magic Booth</p>
              <p className="text-gray-400 text-xs mt-1">
                Tap <span className="inline-block align-middle"><Share className="w-3 h-3 inline" /></span> then <strong>&quot;Add to Home Screen&quot;</strong> for fullscreen.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android/desktop: show install button
  if (canInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <div className="relative bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl shadow-purple-500/10">
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex-shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Install Magic Booth</p>
              <p className="text-gray-400 text-xs mt-0.5">Get the fullscreen booth experience</p>
            </div>
            <button
              onClick={promptInstall}
              className="flex-shrink-0 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm transition-all"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
