'use client';

import { useState, useRef, useEffect } from 'react';
import { Wand2, RotateCcw, RefreshCw, X, Upload, MessageCircle, Printer, Download, Camera, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Theme } from '@/types';

interface ResultScreenProps {
  transformedImageUrl: string;
  selectedTheme: Theme | null;
  userMobile: string;
  userName: string;
  onTryAnotherTheme: () => void;
  onStartOver: () => void;
  onEdit: (prompt: string, referenceImages: string[]) => void;
  expoMode?: string;
  /** Marathon: go back to the camera, keeping the runner's details */
  onRetake?: () => void;
  /** Marathon: make a new poster from the same selfie (new t-shirt colour) */
  onRegenerate?: () => void;
}

export default function ResultScreen({
  transformedImageUrl,
  selectedTheme,
  userMobile,
  userName,
  onTryAnotherTheme,
  onStartOver,
  onEdit,
  expoMode,
  onRetake,
  onRegenerate,
}: ResultScreenProps) {
  const isMarathon = expoMode === 'marathon';
  const [editPrompt, setEditPrompt] = useState('');
  const [editRefs, setEditRefs] = useState<string[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Confetti burst on mount
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = isMarathon
      ? ['#0b6d41', '#ffde59', '#ffffff', '#22c55e', '#fbbf24', '#f97316']
      : ['#a855f7', '#ec4899', '#ffffff', '#8b5cf6', '#f472b6', '#38bdf8'];

    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -200,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 4 + 2,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 6,
    }));

    let frame: number;
    const start = Date.now();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = Date.now() - start;
      const alpha = Math.max(0, 1 - Math.max(0, elapsed - 2000) / 1000);

      particles.forEach(p => {
        p.y += p.speed;
        p.angle += p.spin;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (elapsed < 3000) {
        frame = requestAnimationFrame(animate);
      } else {
        if (document.body.contains(canvas)) document.body.removeChild(canvas);
      }
    };

    frame = requestAnimationFrame(animate);
    const bannerTimer = setTimeout(() => setShowBanner(false), 2200);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(bannerTimer);
      if (document.body.contains(canvas)) document.body.removeChild(canvas);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean phone number for WhatsApp
  const cleanPhone = userMobile.replace(/\D/g, '');
  const whatsappPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const isPublicUrl = transformedImageUrl && !transformedImageUrl.startsWith('data:');
  const firstName = (userName || '').trim().split(/\s+/)[0] || '';
  const whatsappMessage = isMarathon
    ? isPublicUrl
      ? `Hi ${firstName}! 🏅 Congratulations on running the Erode Marathon 2026!\n\nHere is your finisher poster:\n${transformedImageUrl}\n\nI choose a drug-free life! 💪 Run for health. Run for life.\n— Yi Young Indians × JKKN`
      : `Hi ${firstName}! 🏅 Thank you for running the Erode Marathon 2026 — Yi Young Indians × JKKN`
    : isPublicUrl
      ? `Here is your AI transformed photo from Gemini Magic Booth! 🎉\n\n${transformedImageUrl}`
      : `Thank you for visiting Gemini Magic Booth! 🎉`;
  const [whatsappOpened, setWhatsappOpened] = useState(false);

  const handleWhatsAppShare = () => {
    // Validate: Indian mobile numbers must be 10 digits
    const digits = userMobile.replace(/\D/g, '');
    const localDigits = digits.startsWith('91') ? digits.slice(2) : digits;
    if (localDigits.length !== 10) {
      alert('Invalid mobile number. Cannot open WhatsApp.');
      return;
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setWhatsappOpened(true);

    if (isMobile) {
      // Mobile: open WhatsApp app directly to the user's number with image URL in message
      window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
    } else {
      // Desktop: open WhatsApp Web directly to the user's number
      window.open(`https://web.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(whatsappMessage)}`, '_blank');
    }
  };

  const handleDownload = async () => {
    try {
      const origin = window.location.origin;

      // Load the main photo and both logos in parallel
      const loadImg = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const [photo, logo1, logo2] = await Promise.all([
        loadImg(transformedImageUrl),
        loadImg(`${origin}/jkkn-logo.png`),
        loadImg(`${origin}/jkkn-100-logo.png`),
      ]);

      // 4x6 inch at 300 DPI = 1200x1800 px
      const W = 1200;
      const H = 1800;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Draw photo (cover the entire canvas)
      const scale = Math.max(W / photo.width, H / photo.height);
      const sw = photo.width * scale;
      const sh = photo.height * scale;
      ctx.drawImage(photo, (W - sw) / 2, (H - sh) / 2, sw, sh);

      // Logo boxes: 20% width, 10% height with white background
      const logoW = W * 0.2;
      const logoH = H * 0.1;
      const margin = W * 0.025; // ~3mm at print scale

      const pad = 4;
      // Top-left logo — hidden for marathon (logo moves to bottom-left instead)
      if (!isMarathon) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.roundRect(margin, margin, logoW, logoH, 6);
        ctx.fill();
        ctx.drawImage(logo1, margin + pad, margin + pad, logoW - pad * 2, logoH - pad * 2);
      }

      // Bottom-right logo — skipped for marathon: the Erode poster already carries the real
      // Yi | JKKN logos (stamped server-side), and corner logos would cover its bottom panel.
      if (!isMarathon) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.roundRect(W - margin - logoW, H - margin - logoH, logoW, logoH, 6);
        ctx.fill();
        ctx.drawImage(logo2, W - margin - logoW + pad, H - margin - logoH + pad, logoW - pad * 2, logoH - pad * 2);
      }

      // Bottom-left: name pill for standard expos
      if (!isMarathon && userName) {
        const fontSize = 34;
        ctx.font = `600 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
        const starText = '✦ ';
        const starW = ctx.measureText(starText).width;
        const nameW = ctx.measureText(userName.toUpperCase()).width;
        const pillW = starW + nameW + 40;
        const pillH = 52;
        const pillX = margin;
        const pillY = H - margin - pillH;
        const pillR = pillH / 2;

        const grad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
        grad.addColorStop(0, 'rgba(22, 163, 74, 0.9)');
        grad.addColorStop(1, 'rgba(34, 197, 94, 0.9)');
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(starText, pillX + 16, pillY + pillH - 14);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(userName.toUpperCase(), pillX + 16 + starW, pillY + pillH - 14);
      }

      // Export and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemini-magic-booth-${selectedTheme?.id || 'custom'}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.95);
    } catch {
      window.open(transformedImageUrl, '_blank');
    }
  };

  const handlePrint = async () => {
    // Convert a URL to base64 so it loads reliably inside the iframe
    const toBase64 = async (url: string): Promise<string> => {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch { return url; }
    };

    const origin = window.location.origin;
    const [logo1, logo2] = await Promise.all([
      toBase64(`${origin}/jkkn-logo.png`),
      toBase64(`${origin}/jkkn-100-logo.png`),
    ]);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>
      @page { size: 4in 6in; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; padding: 0; width: 4in; height: 6in; overflow: hidden; background: white; }
      .frame { position: relative; width: 4in; height: 6in; overflow: hidden; }
      .photo { display: block; width: 100%; height: 100%; object-fit: cover; }
      .logo-box { position: absolute; width: 20%; height: 10%; background: rgba(255,255,255,0.9); padding: 3px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
      .logo-box img { width: 100%; height: 100%; object-fit: contain; }
      .tl { top: 3mm; left: 3mm; }
      .br { bottom: 3mm; right: 3mm; }
      .user-name { position: absolute; bottom: 3mm; left: 3mm; background: #16a34a !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: #ffffff !important; font: 600 9pt "Segoe UI", system-ui, sans-serif; padding: 4px 14px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.3); letter-spacing: 0.5px; text-transform: uppercase; }
    </style></head><body>
      <div class="frame">
        <img class="photo" src="${transformedImageUrl}" />
        ${!isMarathon ? `<div class="logo-box tl"><img src="${logo1}" /></div>` : ''}
        ${!isMarathon ? `<div class="logo-box br"><img src="${logo2}" /></div>` : ''}
        ${!isMarathon && userName ? `<div class="user-name">✦ ${userName}</div>` : ''}
      </div>
    </body></html>`);
    doc.close();

    const allImgs = Array.from(doc.querySelectorAll('img'));
    let loaded = 0;
    const doPrint = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 2000);
    };
    if (allImgs.length === 0) { setTimeout(doPrint, 500); return; }
    allImgs.forEach((img) => {
      const onDone = () => { loaded++; if (loaded === allImgs.length) doPrint(); };
      if ((img as HTMLImageElement).complete) { onDone(); }
      else { img.onload = onDone; img.onerror = onDone; }
    });
  };

  const handleEditRefImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setEditRefs((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className={`h-screen ${isMarathon ? 'bg-gradient-to-br from-emerald-50 via-white to-orange-50' : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'} text-slate-900 flex flex-col overflow-hidden print:bg-white print:block`}>
      <style>{`
        @keyframes img-reveal {
          from { opacity: 0; transform: scale(0.90); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes glow-marathon {
          0%, 100% { box-shadow: 0 20px 50px rgba(11,109,65,0.22), 0 0 0 1px rgba(11,109,65,0.10); }
          50%       { box-shadow: 0 24px 70px rgba(249,115,22,0.30), 0 0 0 1px rgba(11,109,65,0.14); }
        }
        @keyframes glow-standard {
          0%, 100% { box-shadow: 0 20px 50px rgba(139,92,246,0.22), 0 0 0 1px rgba(139,92,246,0.10); }
          50%       { box-shadow: 0 24px 70px rgba(236,72,153,0.28), 0 0 0 1px rgba(139,92,246,0.14); }
        }
        @keyframes banner-in {
          from { opacity: 0; transform: translateY(-20px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes banner-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-16px) scale(0.95); }
        }
        .img-reveal { animation: img-reveal 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .glow-marathon { animation: glow-marathon 2.2s ease-in-out infinite; }
        .glow-standard { animation: glow-standard 2.2s ease-in-out infinite; }
        .banner-in  { animation: banner-in  0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .banner-out { animation: banner-out 0.4s ease-in forwards; }
        @media print {
          @page { size: 4in 6in; margin: 0; }
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .result-image {
            width: 4in;
            height: 6in;
            object-fit: cover;
            display: block;
          }
        }
      `}</style>
      <header className="print:hidden flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {isMarathon && (
            <div className="hidden sm:flex items-center gap-3 pr-3 border-r border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marathon/yi-logo.png" alt="Yi Young Indians" className="h-9 w-auto object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/jkkn-logo.png" alt="JKKN" className="h-8 w-auto object-contain" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-lg text-slate-900 tracking-tight truncate">
              {isMarathon ? `🏅 ${userName ? `${userName.split(' ')[0]}'s` : 'Your'} Finisher Poster` : '✨ Your Transformation'}
            </h1>
            {!isMarathon && selectedTheme && <p className="text-slate-500 text-xs">{selectedTheme.title}</p>}
            {isMarathon && <p className="text-slate-500 text-xs">Erode Marathon 2026</p>}
          </div>
        </div>
        <button onClick={onStartOver}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors shadow-sm">
          <RotateCcw className="w-4 h-4" /> {isMarathon ? 'Next Runner' : 'Start Over'}
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Image */}
        <div className="h-[60vh] lg:h-auto lg:flex-1 overflow-hidden flex-shrink-0 relative flex items-center justify-center p-4 lg:p-8">
          {/* Celebration banner */}
          {showBanner && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 px-5 py-2.5 rounded-full text-sm font-bold shadow-2xl flex items-center gap-2 ${showBanner ? 'banner-in' : 'banner-out'} ${isMarathon ? 'bg-gradient-to-r from-[#0b6d41] to-[#16a34a] text-[#ffde59]' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'}`}>
              {isMarathon ? '🏅 You crossed the finish line!' : '✨ Your transformation is ready!'}
            </div>
          )}

          {/* Fixed 4:6 (2:3) frame — glow wrapper + reveal animation */}
          <div
            className={`img-reveal rounded-2xl overflow-hidden bg-white border-[6px] border-white ${isMarathon ? 'glow-marathon' : 'glow-standard'}`}
            style={{ aspectRatio: '2/3', height: '100%', maxHeight: '100%', flexShrink: 0 }}
          >
            <img
              src={transformedImageUrl}
              alt="Transformed"
              className="result-image"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="print:hidden lg:w-[22rem] border-t lg:border-t-0 lg:border-l border-slate-200/80 p-4 lg:p-6 flex flex-col gap-3 overflow-y-auto bg-white/85 backdrop-blur-md">
          {isMarathon && (
            <div className="hidden lg:block mb-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Next step</p>
              <p className="text-slate-700 text-sm mt-1">Send the poster to the runner, then start the next one.</p>
            </div>
          )}

          {/* Share / WhatsApp Button */}
          <button onClick={handleWhatsAppShare} className="w-full flex flex-col items-center justify-center rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] px-6 py-4 shadow-lg shadow-green-500/25 transition-colors">
            <span className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-white shrink-0" />
              <span className="text-white font-semibold text-base">
                {isMarathon ? (whatsappOpened ? 'Send Again on WhatsApp' : 'Send to WhatsApp') : 'Share via WhatsApp'}
              </span>
            </span>
            {isMarathon && cleanPhone && (
              <span className="text-white/80 text-xs mt-0.5">to +{whatsappPhone}</span>
            )}
          </button>
          {isMarathon && whatsappOpened && (
            <p className="text-center text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              ✓ WhatsApp opened — press <b>Send</b> in the chat, then tap Next Runner
            </p>
          )}

          {/* Edit with AI — hidden for marathon: edits would drop the stamped official logos */}
          {!isMarathon && (
            <button onClick={() => setShowEdit(!showEdit)} className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-6 py-4 shadow-lg transition-all">
              <Wand2 className="w-5 h-5 text-white shrink-0" />
              <span className="text-white font-semibold text-base">Edit with AI</span>
            </button>
          )}

          {!isMarathon && showEdit && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <Textarea
                placeholder="Describe the edit you want..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 resize-none h-20"
              />
              <button
                onClick={() => editFileRef.current?.click()}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-purple-700 transition-colors"
              >
                <Upload className="w-3 h-3" /> Add reference image
              </button>
              <input ref={editFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleEditRefImage} />
              {editRefs.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {editRefs.map((img, i) => (
                    <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setEditRefs((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0 right-0 bg-black/60 rounded-bl-lg p-0.5"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={() => { onEdit(editPrompt, editRefs); setShowEdit(false); }}
                disabled={!editPrompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-sm gap-2 border-0"
              >
                <Wand2 className="w-4 h-4" /> Apply Edit
              </Button>
            </div>
          )}

          {!isMarathon && (
            <button onClick={onTryAnotherTheme} className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 px-6 py-4 shadow-lg transition-all">
              <RefreshCw className="w-5 h-5 text-white shrink-0" />
              <span className="text-white font-semibold text-base">Try Another Theme</span>
            </button>
          )}

          {/* Marathon: not happy with the poster? Retake the selfie or remake it from the same selfie */}
          {isMarathon && (onRetake || onRegenerate) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <p className="text-xs font-semibold text-slate-500 mb-2 px-1">Not happy with the poster?</p>
              <div className="grid grid-cols-2 gap-2">
                {onRetake && (
                  <button onClick={onRetake}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white border border-orange-200 hover:bg-orange-50 text-orange-700 px-3 py-3 shadow-sm transition-colors">
                    <Camera className="w-4 h-4 shrink-0" />
                    <span className="font-semibold text-sm">Retake Selfie</span>
                  </button>
                )}
                {onRegenerate && (
                  <button onClick={onRegenerate}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 px-3 py-3 shadow-sm transition-colors">
                    <Shuffle className="w-4 h-4 shrink-0" />
                    <span className="font-semibold text-sm">New Poster</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Secondary actions side by side */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleDownload}
              className="flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-3.5 shadow-sm transition-colors">
              <Download className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-sm">Download</span>
            </button>
            <button onClick={handlePrint}
              className="flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-3.5 shadow-sm transition-colors">
              <Printer className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-sm">Print</span>
            </button>
          </div>

          {/* Prominent Next Runner / Start Over — always visible at bottom */}
          <button onClick={onStartOver}
            className={`w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 shadow-lg transition-colors mt-auto ${
              isMarathon
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-600/25'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}>
            <RotateCcw className="w-5 h-5 text-white shrink-0" />
            <span className="text-white font-bold text-base">{isMarathon ? 'Next Runner →' : 'Start Over'}</span>
          </button>

        </div>
      </div>

    </div>
  );
}
