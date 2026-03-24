'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppState, AppScreen, Theme, CareerStyle, UserInfo } from '@/types';
import { STICKER_STORAGE_KEY, MAX_STICKERS, StickerImage } from '@/app/sticker-sheet/page';
import LandingScreen from './booth/LandingScreen';
import CameraScreen from './booth/CameraScreen';
import UserInfoScreen from './booth/UserInfoScreen';
import ThemeSelectionScreen from './booth/ThemeSelectionScreen';
import LoadingScreen from './booth/LoadingScreen';
import ResultScreen from './booth/ResultScreen';
import ErrorScreen from './booth/ErrorScreen';

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
  const [state, setState] = useState<AppState>(initialState);
  // After mount, restore saved session (avoids hydration mismatch)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as AppState;
      if (parsed.screen === 'loading') parsed.screen = 'themeSelection';
      setState(parsed);
    } catch { /* ignore */ }
  }, []);

  // Save state to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      const { capturedPhoto, ...rest } = state;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...rest, capturedPhoto: null }));
      } catch { /* ignore */ }
    }
  }, [state]);

  const clearSession = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  };

  const go = (screen: AppScreen, extra?: Partial<AppState>) =>
    setState((prev) => ({ ...prev, screen, ...extra }));

  const handlePhotoReady = (photo: string) => {
    go('userInfo', { capturedPhoto: photo });
  };

  const handleUserInfo = (info: UserInfo) => {
    go('themeSelection', { userInfo: info });
  };

  const handleTransform = useCallback(
    async (theme: Theme | null, customPrompt: string, careerStyle: CareerStyle, referenceImages: string[]) => {
      if (!state.capturedPhoto) return;

      go('loading', { selectedTheme: theme, careerStyle, customPrompt, referenceImages });

      try {
        const themePrompt = theme ? theme.prompt : customPrompt;
        const themeType = theme ? theme.type : 'custom';
        const themeTitle = theme ? theme.title : 'Custom';

        const res = await fetch('/api/transform-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: state.capturedPhoto,
            themePrompt: customPrompt ? `${themePrompt}. Additional instruction: ${customPrompt}` : themePrompt,
            themeTitle,
            themeType,
            careerStyle,
            isEdit: false,
            referenceImages,
            userInfo: state.userInfo,
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
                  name: state.userInfo?.name || '',
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
        if (state.userInfo) {
          fetch('/api/save-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: state.userInfo.name,
              mobile: state.userInfo.mobile,
              group: state.userInfo.group,
              theme: themeTitle,
              themeType,
              careerStyle,
              photoUrl: photoPublicUrl,
              originalPhoto: state.capturedPhoto,
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
    [state.capturedPhoto, state.userInfo]
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

  switch (state.screen) {
    case 'landing':
      return (
        <LandingScreen
          onOpenCamera={() => go('camera')}
          onPhotoUpload={handlePhotoReady}
        />
      );

    case 'camera':
      return (
        <CameraScreen
          onCapture={handlePhotoReady}
          onBack={() => go('landing')}
        />
      );

    case 'userInfo':
      return (
        <UserInfoScreen
          capturedPhoto={state.capturedPhoto!}
          onNext={handleUserInfo}
          onBack={() => go('camera')}
        />
      );

    case 'themeSelection':
      return (
        <ThemeSelectionScreen
          capturedPhoto={state.capturedPhoto!}
          onTransform={handleTransform}
          onBack={() => go('userInfo')}
        />
      );

    case 'loading':
      return <LoadingScreen themeName={state.selectedTheme?.title || state.customPrompt || ''} />;

    case 'result':
      return (
        <ResultScreen
          transformedImageUrl={state.transformedImageUrl!}
          selectedTheme={state.selectedTheme}
          userMobile={state.userInfo?.mobile || ''}
          onTryAnotherTheme={() => go('themeSelection')}
          onStartOver={clearSession}
          onEdit={handleEdit}
        />
      );

    case 'error':
      return (
        <ErrorScreen
          message={state.errorMessage}
          onStartOver={clearSession}
        />
      );

    default:
      return null;
  }
}
