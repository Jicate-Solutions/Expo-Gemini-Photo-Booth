'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

/**
 * Shown on the booth/admin when a new deploy is detected.
 * The service worker uses skipWaiting + clientsClaim (app/sw.ts), so the new version is
 * ALREADY active by the time this appears — "Update" just reloads the page to load it.
 */
export default function UpdatePrompt() {
  const pathname = usePathname();
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // Only an UPDATE (a previous version was in control), not the very first install
          if ((newWorker.state === 'installed' || newWorker.state === 'activated') && navigator.serviceWorker.controller) {
            setShowReload(true);
          }
        });
      });
    });
  }, []);

  // Public visitor pages (reels contest QR) never show this
  if (!showReload || pathname?.startsWith('/reels')) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex-shrink-0">
          <RefreshCw className="w-5 h-5 text-white" />
        </div>
        <p className="text-white text-sm flex-1">A new version is available!</p>
        <button
          onClick={() => setShowReload(false)}
          className="flex-shrink-0 px-3 py-2 rounded-lg text-gray-300 hover:text-white text-sm transition-colors"
        >
          Later
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex-shrink-0 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all"
        >
          Update
        </button>
      </div>
    </div>
  );
}
