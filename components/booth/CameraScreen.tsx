'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, FlipHorizontal, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraScreenProps {
  onCapture: (photo: string) => void;
  onBack: () => void;
}

export default function CameraScreen({ onCapture, onBack }: CameraScreenProps) {
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

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Background glow */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/20 via-gray-950 to-gray-950 pointer-events-none" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-4 px-4 md:px-6 py-3 md:py-4 border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => { stopCamera(); onBack(); }}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Take a Photo</h1>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        {error ? (
          <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10">
            <X className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => { setError(''); startCamera(); }} variant="outline" className="gap-2">
                <Camera className="w-4 h-4" /> Retry
              </Button>
              <Button onClick={onBack} variant="outline">Go Back</Button>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-2xl">
            {/* Video */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video ring-1 ring-purple-500/30 shadow-[0_0_60px_rgba(139,92,246,0.15)]">
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <span className="text-white text-8xl font-black drop-shadow-[0_0_30px_rgba(139,92,246,0.8)] animate-pulse">{countdown}</span>
                </div>
              )}
              {/* Face guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-56 border-2 border-dashed border-purple-400/40 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.2)]" />
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMirrored(!mirrored)}
                className="w-12 h-12 rounded-full border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10"
                title="Flip camera"
              >
                <FlipHorizontal className="w-5 h-5" />
              </Button>
              {/* Capture button */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 blur-xl opacity-60 animate-pulse" />
                <button
                  onClick={capturePhoto}
                  disabled={countdown !== null}
                  className="relative w-18 h-18 w-[72px] h-[72px] rounded-full bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 disabled:opacity-40 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Camera className="w-7 h-7 text-white" />
                </button>
              </div>
              <div className="w-12 h-12" />
            </div>
            <p className="text-center text-gray-500 text-sm mt-4">
              Position your face in the circle and press capture
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
