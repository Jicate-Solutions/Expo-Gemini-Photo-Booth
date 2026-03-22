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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      setError('Could not access camera. Please allow camera permission.');
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
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <Button variant="ghost" size="icon" onClick={() => { stopCamera(); onBack(); }}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-lg">Take a Photo</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {error ? (
          <div className="text-center">
            <X className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={onBack} variant="outline">Go Back</Button>
          </div>
        ) : (
          <div className="relative w-full max-w-2xl">
            {/* Video */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-white text-8xl font-bold animate-pulse">{countdown}</span>
                </div>
              )}
              {/* Face guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-56 border-2 border-dashed border-white/30 rounded-full" />
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMirrored(!mirrored)}
                className="w-12 h-12 rounded-full border-white/20"
                title="Flip camera"
              >
                <FlipHorizontal className="w-5 h-5" />
              </Button>
              <Button
                onClick={capturePhoto}
                disabled={countdown !== null}
                className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center"
              >
                <Camera className="w-7 h-7" />
              </Button>
              <div className="w-12 h-12" />
            </div>
            <p className="text-center text-gray-500 text-sm mt-3">
              Position your face in the circle and press capture
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
