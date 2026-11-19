'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppState, AppScreen, Theme, CareerStyle, UserInfo, BoothSession } from '@/types';
import { STICKER_STORAGE_KEY, MAX_STICKERS, StickerImage } from '@/app/sticker-sheet/page';
import LandingScreen from './booth/LandingScreen';
import CameraScreen from './booth/CameraScreen';
import UserInfoScreen, { USER_INFO_DRAFT_KEY } from './booth/UserInfoScreen';
import ThemeSelectionScreen from './booth/ThemeSelectionScreen';
import MarathonScreen, { buildMarathonTheme, MARATHON_THEME_ID } from './booth/MarathonScreen';
import LoadingScreen from './booth/LoadingScreen';
import ResultScreen from './booth/ResultScreen';
import ErrorScreen from './booth/ErrorScreen';
import BoothLoginScreen from './booth/BoothLoginScreen';
import ExpoStatsView from './booth/ExpoStatsView';

const STORAGE_KEY = 'booth_session';

const initialState: AppState = {
  screen: 'landing',
  capturedPhoto: null,
  selectedTheme: null,
  careerStyle: 'photorealistic',
  customPrompt: '',
  transformedImageUrl: null,
  userInfo: null,
  errorMessage: '',
  referenceImages: [],
};

export default function PhotoBooth() {
  const [boothLoggedIn, setBoothLoggedIn] = useState(false);
  const [state, setState] = useState<AppState>(initialState);
  const [session, setSession] = useState<BoothSession | null>(null);
  const [expoGroups, setExpoGroups] = useState<{ id: string; name: string }[]>([]);
  const [showStats, setShowStats] = useState(false);
  // False until the saved login + screen have been read from sessionStorage.
  // Until then we show a neutral splash instead of the login page, so a refresh
  // doesn't flash "login" before jumping back to the current screen.
  const [restored, setRestored] = useState(false);

  // Check booth login session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('booth_session_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as BoothSession;
        setSession(parsed);
        setBoothLoggedIn(true);
      } catch { /* ignore */ }
    }
  }, []);

  // Fetch groups when session is available
  useEffect(() => {
    if (!session?.expoId) return;
    fetch(`/api/expos/${session.expoId}/groups`)
      .then(r => r.json())
      .then(d => setExpoGroups(d.data || []))
      .catch(() => setExpoGroups([]));
  }, [session?.expoId]);

  // After mount, restore saved session (avoids hydration mismatch)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as AppState;
      // The selfie isn't persisted (too big for storage), so any screen that needs it must
      // fall back to a sensible place. Details (userInfo) ARE persisted and are kept.
      let mode: string | undefined;
      try { mode = (JSON.parse(sessionStorage.getItem('booth_session_data') || 'null') as BoothSession | null)?.expoMode; } catch { /* ignore */ }
      const marathon = mode === 'marathon';
      if (marathon) {
        // Refreshed mid-generation or before the selfie → retake selfie with details kept
        if (parsed.screen === 'loading' || parsed.screen === 'themeSelection' || parsed.screen === 'error') {
          parsed.screen = parsed.userInfo ? 'camera' : 'userInfo';
        }
      } else if (parsed.screen === 'loading' || parsed.screen === 'themeSelection' || parsed.screen === 'userInfo') {
        // Standard flow: photo comes first, so go back to the camera (typed details survive as a draft)
        parsed.screen = 'camera';
      }
      setState(parsed);
    } catch { /* ignore */ }
  }, []);

  // Runs after the two restore effects above (effects run in order), so by the time this
  // re-renders, the login and screen are already restored — no login-page flash.
  useEffect(() => { setRestored(true); }, []);

  // Save state to sessionStorage on every change
  // Always strip large base64 fields (capturedPhoto, referenceImages) to avoid quota overflow.
  // transformedImageUrl is a Supabase public URL (small) so it persists fine.
  useEffect(() => {
    // Skip the untouched initial state: on mount this effect runs right after the restore
    // effect (twice in dev Strict Mode) and would otherwise overwrite the saved data with
    // an empty state before the restored one is applied.
    if (state === initialState) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { capturedPhoto, referenceImages, transformedImageUrl, ...rest } = state;
      const urlToSave = transformedImageUrl?.startsWith('data:') ? null : transformedImageUrl;
      const screenToSave = (!urlToSave && rest.screen === 'result') ? 'landing' : rest.screen;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...rest,
        screen: screenToSave,
        capturedPhoto: null,
        referenceImages: [],
        transformedImageUrl: urlToSave,
      }));
    } catch { /* ignore */ }
  }, [state]);

  const handleBoothLogin = (sessionData: BoothSession) => {
    setSession(sessionData);
    setBoothLoggedIn(true);
    sessionStorage.setItem('booth_session_data', JSON.stringify(sessionData));
    sessionStorage.setItem('booth_logged_in', 'true');
  };

  const clearSession = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('booth_session_data');
    sessionStorage.removeItem('booth_logged_in');
    sessionStorage.removeItem(USER_INFO_DRAFT_KEY);
    setState(initialState);
    setSession(null);
    setBoothLoggedIn(false);
  };

  // Reset photo flow for a new user without logging out of the booth
  // Marathon stall flow: details (name, bib, WhatsApp) → selfie → poster → send → next runner
  const isMarathon = session?.expoMode === 'marathon';

  const resetForNextUser = () => {
    // Marathon: next runner starts at the details form; other expos start at the camera
    setState({ ...initialState, screen: isMarathon ? 'userInfo' : 'camera' });
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(USER_INFO_DRAFT_KEY); // fresh, empty form for the next visitor
  };

  const go = (screen: AppScreen, extra?: Partial<AppState>) =>
    setState((prev) => ({ ...prev, screen, ...extra }));

  const handlePhotoReady = (photo: string) => {
    if (isMarathon && state.userInfo) {
      // Details already filled in → generate the poster straight from the selfie
      setState(prev => ({ ...prev, capturedPhoto: photo }));
      handleTransform(buildMarathonTheme(), '', 'photorealistic', [], state.userInfo, photo);
      return;
    }
    go('userInfo', { capturedPhoto: photo });
  };

  const handleUserInfo = (info: UserInfo) => {
    if (isMarathon) {
      if (state.capturedPhoto) {
        // Photo was uploaded before the details → generate right away
        setState(prev => ({ ...prev, userInfo: info }));
        handleTransform(buildMarathonTheme(), '', 'photorealistic', [], info);
      } else {
        // Normal stall flow: details first, then the selfie
        go('camera', { userInfo: info });
      }
    } else {
      go('themeSelection', { userInfo: info });
    }
  };

  const handleTransform = useCallback(
    async (theme: Theme | null, customPrompt: string, careerStyle: CareerStyle, referenceImages: string[], userInfoOverride?: UserInfo, photoOverride?: string) => {
      // photoOverride: the marathon flow generates in the same tick the selfie is taken,
      // before state.capturedPhoto has updated
      const photo = photoOverride || state.capturedPhoto;
      if (!photo) return;

      go('loading', { selectedTheme: theme, careerStyle, customPrompt, referenceImages });

      try {
        const themePrompt = theme ? theme.prompt : customPrompt;
        const themeType = theme ? theme.type : 'custom';
        const themeTitle = theme ? theme.title : 'Custom';
        const userInfo = userInfoOverride || state.userInfo;

        const res = await fetch('/api/transform-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: photo,
            themePrompt: customPrompt ? `${themePrompt}. Additional instruction: ${customPrompt}` : themePrompt,
            themeTitle,
            themeType,
            careerStyle,
            isEdit: false,
            referenceImages,
            userInfo,
            marathonPoster: theme?.id === MARATHON_THEME_ID,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Transformation failed');

        // Upload image and save user data via dedicated API routes
        const base64 = data.transformedImage.split(',')[1];
        const mimeType = data.transformedImage.split(';')[0].split(':')[1] || 'image/jpeg';
        let photoPublicUrl = '';
        try {
          const uploadRes = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64, mimeType }),
          });
          const uploadData = await uploadRes.json();
          photoPublicUrl = uploadData.publicUrl || '';
          // Auto-save to sticker sheet
          if (photoPublicUrl) {
            try {
              const existing: StickerImage[] = JSON.parse(localStorage.getItem(STICKER_STORAGE_KEY) || '[]');
              if (existing.length < MAX_STICKERS) {
                existing.push({
                  id: Date.now().toString(),
                  url: photoPublicUrl,
                  name: userInfo?.name || '',
                  theme: themeTitle,
                  addedAt: new Date().toISOString(),
                });
                localStorage.setItem(STICKER_STORAGE_KEY, JSON.stringify(existing));
              }
            } catch (stickerErr) {
              console.error('Sticker save failed:', stickerErr);
            }
          }
        } catch (e) {
          console.error('Upload failed:', e);
        }

        // Save user data once — only here, not in transform-image route
        if (userInfo) {
          fetch('/api/save-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: userInfo.name,
              mobile: userInfo.mobile,
              group: userInfo.group,
              expoId: session?.expoId || null,
              groupId: userInfo?.groupId || null,
              bibNumber: userInfo?.bibNumber || null,
              gender: userInfo?.gender || null,
              theme: themeTitle,
              themeType,
              careerStyle,
              photoUrl: photoPublicUrl,
              originalPhoto: photo,
            }),
          }).catch(e => console.error('Save user failed:', e));
        }

        const publicUrl: string = photoPublicUrl || data.transformedImage;
        go('result', { transformedImageUrl: publicUrl });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        go('error', { errorMessage: message });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.capturedPhoto, state.userInfo, session]
  );

  const handleEdit = useCallback(
    async (editPrompt: string, editRefs: string[]) => {
      if (!state.transformedImageUrl) return;

      go('loading', { selectedTheme: null, customPrompt: editPrompt });

      try {
        // If the image is a URL (not base64), fetch and convert to base64
        let imageData = state.transformedImageUrl;
        if (!imageData.startsWith('data:')) {
          const imgRes = await fetch(imageData);
          const blob = await imgRes.blob();
          imageData = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }

        const res = await fetch('/api/transform-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData,
            themePrompt: editPrompt,
            themeTitle: 'Edit',
            themeType: 'custom',
            careerStyle: null,
            isEdit: true,
            referenceImages: editRefs,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Edit failed');

        go('result', { transformedImageUrl: data.transformedImage });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Edit failed. Please try again.';
        go('error', { errorMessage: message });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.transformedImageUrl]
  );

  if (!restored) {
    // Neutral splash for the split second before the saved session is known
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <span className="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (!boothLoggedIn) {
    return <BoothLoginScreen onLogin={handleBoothLogin} />;
  }

  if (showStats && session) {
    return (
      <ExpoStatsView
        expoId={session.expoId}
        expoName={session.expoName}
        onBack={() => setShowStats(false)}
      />
    );
  }

  switch (state.screen) {
    case 'landing':
      return (
        <LandingScreen
          onOpenCamera={() => go(isMarathon ? 'userInfo' : 'camera')}
          onPhotoUpload={handlePhotoReady}
          onLogout={clearSession}
          expoName={session?.expoName}
          onShowStats={() => setShowStats(true)}
          expoMode={session?.expoMode}
        />
      );

    case 'camera':
      return (
        <CameraScreen
          onCapture={handlePhotoReady}
          onBack={() => go(isMarathon ? 'userInfo' : 'landing')}
          expoMode={session?.expoMode}
        />
      );

    case 'userInfo':
      return (
        <UserInfoScreen
          capturedPhoto={state.capturedPhoto || undefined}
          initialInfo={state.userInfo || undefined}
          groups={expoGroups}
          onNext={handleUserInfo}
          onBack={() => go(isMarathon ? 'landing' : 'camera')}
          expoMode={session?.expoMode}
        />
      );

    case 'themeSelection':
      return session?.expoMode === 'marathon' ? (
        <MarathonScreen
          capturedPhoto={state.capturedPhoto!}
          userName={state.userInfo?.name || ''}
          onTransform={handleTransform}
          onBack={() => go('userInfo')}
        />
      ) : (
        <ThemeSelectionScreen
          capturedPhoto={state.capturedPhoto!}
          onTransform={handleTransform}
          onBack={() => go('userInfo')}
        />
      );

    case 'loading':
      return (
        <LoadingScreen
          themeName={state.selectedTheme?.title || state.customPrompt || ''}
          expoMode={session?.expoMode}
          userName={state.userInfo?.name}
        />
      );

    case 'result':
      return (
        <ResultScreen
          transformedImageUrl={state.transformedImageUrl!}
          selectedTheme={state.selectedTheme}
          userMobile={state.userInfo?.mobile || ''}
          userName={state.userInfo?.name || ''}
          onTryAnotherTheme={() => go('themeSelection')}
          onStartOver={resetForNextUser}
          onEdit={handleEdit}
          expoMode={session?.expoMode}
          onRetake={isMarathon && state.userInfo ? () => go('camera', { capturedPhoto: null, transformedImageUrl: null }) : undefined}
          onRegenerate={isMarathon && state.userInfo && state.capturedPhoto
            ? () => handleTransform(buildMarathonTheme(), '', 'photorealistic', [], state.userInfo ?? undefined, state.capturedPhoto ?? undefined)
            : undefined}
        />
      );

    case 'error':
      return (
        <ErrorScreen
          message={state.errorMessage}
          onStartOver={resetForNextUser}
          // Marathon: keep the runner's name/bib/WhatsApp and just retake the selfie
          onRetry={isMarathon && state.userInfo ? () => go('camera', { capturedPhoto: null }) : undefined}
          startOverLabel={isMarathon ? 'Next Runner' : 'Start Over'}
        />
      );

    default:
      return null;
  }
}
