'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, FlipHorizontal, ArrowLeft, VideoOff } from 'lucide-react';

interface CameraScreenProps {
  onCapture: (photo: string) => void;
  onBack: () => void;
  expoMode?: string;
}

export default function CameraScreen({ onCapture, onBack, expoMode }: CameraScreenProps) {
  const isMarathon = expoMode === 'marathon';
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mirrored, setMirrored] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      // Check if mediaDevices is available (may be blocked in insecure contexts)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not available. Please use HTTPS or a supported browser.');
        return;
      }

      // Try front camera first, fall back to any camera
      let s: MediaStream;
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch {
        // Fallback: try without facingMode constraint
        s = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        // Ensure video plays in PWA standalone mode
        try { await videoRef.current.play(); } catch {}
      }
      setCameraReady(true);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser/device settings and reload.');
      } else if (err?.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera. Please allow camera permission and reload.');
      }
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
  };

  const capturePhoto = () => {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        takeSnapshot();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    onCapture(dataUrl);
  };

  // Bright theme: marathon = JKKN green + orange, standard = purple/pink
  const T = isMarathon
    ? {
        page: 'bg-gradient-to-br from-emerald-50 via-white to-orange-50',
        blobA: 'bg-emerald-200/50', blobB: 'bg-orange-200/50',
        frame: 'ring-emerald-200', guide: 'border-emerald-400/80',
        shutter: 'from-emerald-500 to-emerald-600', shutterGlow: 'bg-emerald-400/50',
        primary: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25',
      }
    : {
        page: 'bg-gradient-to-br from-purple-50 via-white to-pink-50',
        blobA: 'bg-purple-200/50', blobB: 'bg-pink-200/50',
        frame: 'ring-purple-200', guide: 'border-purple-400/80',
        shutter: 'from-purple-500 to-pink-600', shutterGlow: 'bg-purple-400/50',
        primary: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25',
      };

  return (
    <div className={`min-h-screen ${T.page} text-slate-900 flex flex-col`}>
      <div className={`fixed -top-24 -left-24 w-96 h-96 ${T.blobA} rounded-full blur-3xl pointer-events-none`} />
      <div className={`fixed -bottom-24 -right-24 w-96 h-96 ${T.blobB} rounded-full blur-3xl pointer-events-none`} />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-4 md:px-6 py-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <button onClick={() => { stopCamera(); onBack(); }} aria-label="Back"
          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg text-slate-900 tracking-tight">{isMarathon ? 'Take Your Selfie' : 'Take a Photo'}</h1>
        {isMarathon && (
          <div className="ml-auto flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marathon/yi-logo.png" alt="Yi Young Indians" className="h-9 w-auto object-contain" />
            <span className="w-px h-7 bg-slate-300" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jkkn-logo.png" alt="JKKN" className="h-8 w-auto object-contain" />
          </div>
        )}
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        {error ? (
          <div className="w-full max-w-md text-center bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
              <VideoOff className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Camera not available</h2>
            <p className="mt-2 text-slate-600">{error}</p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button onClick={onBack}
                className="h-12 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                Go Back
              </button>
              <button onClick={() => { setError(''); startCamera(); }}
                className={`h-12 rounded-xl ${T.primary} text-white font-bold shadow-lg flex items-center justify-center gap-2 transition-colors`}>
                <Camera className="w-4 h-4" /> Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-2xl">
            {/* Video in a white frame */}
            <div className={`relative rounded-3xl overflow-hidden bg-slate-900 aspect-video border-[6px] border-white ring-1 ${T.frame} shadow-2xl shadow-slate-300/60`}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
              />
              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
                  <span className="w-36 h-36 rounded-full bg-white/90 shadow-2xl flex items-center justify-center text-slate-900 text-7xl font-black animate-pulse">
                    {countdown}
                  </span>
                </div>
              )}
              {/* Face guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-48 h-56 border-[3px] border-dashed ${T.guide} rounded-full`} />
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Controls */}
            <div className="flex items-center justify-center gap-8 mt-7">
              <button
                onClick={() => setMirrored(!mirrored)}
                className="w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm flex items-center justify-center transition-colors"
                title="Flip camera"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>
              {/* Capture button */}
              <div className="relative">
                <div className={`absolute inset-0 rounded-full ${T.shutterGlow} blur-xl animate-pulse`} />
                <button
                  onClick={capturePhoto}
                  disabled={countdown !== null}
                  aria-label="Take photo"
                  className="relative w-[84px] h-[84px] rounded-full bg-white p-1.5 shadow-xl disabled:opacity-50 transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  <span className={`w-full h-full rounded-full bg-gradient-to-br ${T.shutter} flex items-center justify-center`}>
                    <Camera className="w-8 h-8 text-white" />
                  </span>
                </button>
              </div>
              <div className="w-12 h-12" />
            </div>
            <p className="text-center text-slate-500 text-sm mt-4">
              Fit your face inside the circle, then tap the button — a 3-second countdown starts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
