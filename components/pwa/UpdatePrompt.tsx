'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function UpdatePrompt() {
  const [showReload, setShowReload] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShowReload(true);
          }
        });
      });
    });
  }, []);

  function handleUpdate() {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    waitingWorker.addEventListener('statechange', () => {
      if (waitingWorker.state === 'activated') {
        window.location.reload();
      }
    });
  }

  if (!showReload) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex-shrink-0">
          <RefreshCw className="w-5 h-5 text-white" />
        </div>
        <p className="text-white text-sm flex-1">A new version is available!</p>
        <button
          onClick={handleUpdate}
          className="flex-shrink-0 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all"
        >
          Update
        </button>
      </div>
    </div>
  );
}
