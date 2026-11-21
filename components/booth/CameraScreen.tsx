'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, FlipHorizontal, ArrowLeft, VideoOff, User, RotateCcw, SwitchCamera } from 'lucide-react';

interface CameraScreenProps {
  /** bodyPhoto is only set when captureBody is on and the runner didn't skip step 2 */
  onCapture: (photo: string, bodyPhoto?: string | null) => void;
  onBack: () => void;
  expoMode?: string;
  /** Marathon: after the face close-up, take a second full-body photo (skippable) */
  captureBody?: boolean;
}

export default function CameraScreen({ onCapture, onBack, expoMode, captureBody = false }: CameraScreenProps) {
  const isMarathon = expoMode === 'marathon';
  // Two-step capture: 'face' close-up first, then 'body' (stand back, whole body in frame)
  const [step, setStep] = useState<'face' | 'body'>('face');
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Ref (not state) so cleanup and camera switching always stop the CURRENT stream
  const streamRef = useRef<MediaStream | null>(null);
  // 'user' = front (selfie) camera, 'environment' = back camera. Kept for both face and body steps.
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [mirrored, setMirrored] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    startCamera('user');
    return () => stopCamera();
  }, []);

  const startCamera = async (want: 'user' | 'environment'): Promise<boolean> => {
    try {
      // Check if mediaDevices is available (may be blocked in insecure contexts)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not available. Please use HTTPS or a supported browser.');
        return false;
      }

      // Release the old camera first: many phones cannot open front and back at the same time
      stopCamera();

      // Ask for the chosen camera; 'exact' makes phones really switch, then relax step by step
      const size = { width: { ideal: 1920 }, height: { ideal: 1080 } };
      let s: MediaStream;
      try {
        s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: want }, ...size } });
      } catch {
        try {
          s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: want, ...size } });
        } catch {
          s = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      streamRef.current = s;
      // The selfie camera is shown mirrored (like a mirror); the back camera is not
      setFacing(want);
      setMirrored(want === 'user');
      // Only show the switch button when the device really has 2+ cameras (labels need permission first)
      navigator.mediaDevices.enumerateDevices()
        .then(list => setHasMultipleCameras(list.filter(d => d.kind === 'videoinput').length > 1))
        .catch(() => undefined);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        // Ensure video plays in PWA standalone mode
        try { await videoRef.current.play(); } catch {}
      }
      setCameraReady(true);
      setError('');
      return true;
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser/device settings and reload.');
      } else if (err?.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera. Please allow camera permission and reload.');
      }
      return false;
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Front ⇄ back camera. If the other camera fails, go back to the one that worked.
  const switchCamera = async () => {
    if (switching || countdown !== null) return;
    setSwitching(true);
    const from = facing;
    const ok = await startCamera(from === 'user' ? 'environment' : 'user');
    if (!ok) await startCamera(from);
    setSwitching(false);
  };

  const capturePhoto = () => {
    // Longer countdown for the full-body shot, so the runner can step back
    const start = step === 'body' ? 8 : 3;
    setCountdown(start);
    let count = start;
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

    if (captureBody && step === 'face') {
      // Keep the camera running for step 2
      setFacePhoto(dataUrl);
      setStep('body');
      return;
    }
    stopCamera();
    if (captureBody && step === 'body') onCapture(facePhoto!, dataUrl);
    else onCapture(dataUrl);
  };

  const skipBody = () => {
    if (!facePhoto) return;
    stopCamera();
    onCapture(facePhoto, null);
  };

  const retakeFace = () => {
    setFacePhoto(null);
    setStep('face');
  };

  const isBodyStep = captureBody && step === 'body';

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
        <h1 className="font-bold text-lg text-slate-900 tracking-tight">{captureBody ? (isBodyStep ? 'Step 2 of 2 · Full Body' : 'Step 1 of 2 · Face Close-up') : isMarathon ? 'Take Your Selfie' : 'Take a Photo'}</h1>
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
              <button onClick={() => { setError(''); startCamera(facing); }}
                className={`h-12 rounded-xl ${T.primary} text-white font-bold shadow-lg flex items-center justify-center gap-2 transition-colors`}>
                <Camera className="w-4 h-4" /> Retry
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`relative w-full ${isBodyStep ? '' : 'max-w-2xl'}`}
            // Body step: as big as the screen allows (16:9 video, leaving room for the banner + buttons)
            style={isBodyStep ? { maxWidth: 'min(72rem, calc((100vh - 270px) * 16 / 9))' } : undefined}
          >
            {captureBody && (
              <div className={`mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3 ${isBodyStep ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
                {isBodyStep && facePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={facePhoto} alt="Face photo" className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow" />
                ) : (
                  <span className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><Camera className="w-6 h-6" /></span>
                )}
                <div className="min-w-0 text-sm">
                  {isBodyStep ? (
                    <>
                      <p className="font-bold text-orange-800">✓ Face done! Now the full-body photo</p>
                      <p className="text-orange-700/80">Staff tap the button → runner walks back 2–3 m → 8-second countdown</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-slate-900">Come close — face fills the circle</p>
                      <p className="text-slate-500">Look at the camera, good light on your face</p>
                    </>
                  )}
                </div>
                {isBodyStep && (
                  <button onClick={retakeFace} className="ml-auto shrink-0 flex items-center gap-1 text-xs font-semibold text-orange-700 hover:text-orange-900">
                    <RotateCcw className="w-3.5 h-3.5" /> Retake face
                  </button>
                )}
              </div>
            )}
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
              {countdown !== null && !isBodyStep && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
                  <span className="w-36 h-36 rounded-full bg-white/90 shadow-2xl flex items-center justify-center text-slate-900 text-7xl font-black animate-pulse">
                    {countdown}
                  </span>
                </div>
              )}
              {/* Body step: huge corner countdown, readable from 3 m, without hiding the guide */}
              {countdown !== null && isBodyStep && (
                <div className="absolute top-4 right-4 z-20 pointer-events-none">
                  <span className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-orange-500/90 text-white shadow-2xl flex items-center justify-center text-7xl sm:text-8xl font-black animate-pulse">
                    {countdown}
                  </span>
                </div>
              )}
              {/* Face guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {isBodyStep ? (
                  <>
                    {/* Head line (top) and feet line (bottom): the whole body must be between them */}
                    <div className="absolute left-0 right-0 top-[5%] border-t-[3px] border-dashed border-emerald-300/90">
                      <span className="absolute left-3 -top-3.5 bg-emerald-500 text-white text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-full shadow">▼ HEAD here</span>
                    </div>
                    <div className="absolute left-0 right-0 bottom-[4%] border-t-[3px] border-dashed border-emerald-300/90">
                      <span className="absolute left-3 -top-3.5 bg-emerald-500 text-white text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-full shadow">▲ FEET here</span>
                    </div>
                    {/* Person outline between the lines */}
                    <svg viewBox="0 0 100 260" className="h-[89%] w-auto opacity-90" fill="none" aria-hidden="true">
                      <g fill="rgba(255,255,255,0.08)" stroke="white" strokeWidth="2.2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="50" cy="19" r="14" />
                        <path d="M44 36 Q30 39 27 48 L20 118 Q22 125 27 120 L33 66 L34 130 L35 246 Q40 252 47 248 L49 142 Q50 138 51 142 L53 248 Q60 252 65 246 L66 130 L67 66 L73 120 Q78 125 80 118 L73 48 Q70 39 56 36 Z" />
                      </g>
                    </svg>
                    {/* Big instruction, readable from a distance (hidden during the countdown) */}
                    {countdown === null && (
                      <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[90%] text-center">
                        <span className="inline-block bg-white/90 text-slate-900 font-extrabold text-lg sm:text-2xl px-5 py-2.5 rounded-2xl shadow-xl">
                          Step back until your head &amp; feet fit between the lines
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`w-48 h-56 border-[3px] border-dashed ${T.guide} rounded-full`} />
                )}
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 sm:gap-8 mt-7">
              <div className="flex items-center gap-2">
                {hasMultipleCameras && (
                  <button
                    onClick={switchCamera}
                    disabled={switching || countdown !== null}
                    className="h-12 px-4 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-sm flex items-center gap-1.5 text-sm font-semibold transition-colors disabled:opacity-40"
                    title={facing === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
                  >
                    <SwitchCamera className={`w-5 h-5 ${switching ? 'animate-spin' : ''}`} />
                    {facing === 'user' ? 'Back' : 'Front'}
                  </button>
                )}
                <button
                  onClick={() => setMirrored(!mirrored)}
                  className="w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm flex items-center justify-center transition-colors"
                  title="Mirror the picture"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>
              </div>
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
              {isBodyStep ? (
                <button
                  onClick={skipBody}
                  disabled={countdown !== null}
                  title="Skip the full-body photo"
                  className="h-12 px-4 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm flex items-center gap-1.5 text-sm font-semibold transition-colors disabled:opacity-40"
                >
                  <User className="w-4 h-4" /> Skip
                </button>
              ) : (
                <div className="w-12 h-12" />
              )}
            </div>
            <p className="text-center text-slate-500 text-sm mt-4">
              {isBodyStep
                ? facing === 'environment'
                  ? 'Back camera: fit the runner from head to feet between the lines, then tap the button. Ask them to stand straight, arms relaxed.'
                  : 'Tap the button, then step back — an 8-second countdown gives you time. Stand straight, arms relaxed. Skip if there is no space.'
                : facing === 'environment'
                  ? 'Back camera: fit the runner\'s face inside the circle, then tap the button — a 3-second countdown starts'
                  : 'Fit your face inside the circle, then tap the button — a 3-second countdown starts'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
