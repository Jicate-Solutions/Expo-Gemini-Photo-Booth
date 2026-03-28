'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
    );

    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  async function promptInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
      return outcome === 'accepted';
    }
    // No deferred prompt available — guide user to browser install option
    return false;
  }

  const canInstall = !isStandalone && !isInstalled && !!deferredPrompt;
  const showIOSGuide = !isStandalone && !isInstalled && isIOS && !deferredPrompt;
  // Show install button whenever app is not running as standalone PWA
  const showInstallButton = !isStandalone && !isInstalled;
  const hasNativePrompt = !!deferredPrompt;

  return { canInstall, showIOSGuide, showInstallButton, hasNativePrompt, isStandalone, isInstalled, isIOS, promptInstall };
}
