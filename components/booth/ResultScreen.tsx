'use client';

import { useState, useRef } from 'react';
import { Wand2, RotateCcw, RefreshCw, X, Upload, MessageCircle, Printer, Download } from 'lucide-react';
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
}

export default function ResultScreen({
  transformedImageUrl,
  selectedTheme,
  userMobile,
  userName,
  onTryAnotherTheme,
  onStartOver,
  onEdit,
}: ResultScreenProps) {
  const [editPrompt, setEditPrompt] = useState('');
  const [editRefs, setEditRefs] = useState<string[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Clean phone number and build WhatsApp URL (fallback for desktop)
  const cleanPhone = userMobile.replace(/\D/g, '');
  const whatsappPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const isPublicUrl = transformedImageUrl && !transformedImageUrl.startsWith('data:');
  const whatsappMessage = isPublicUrl
    ? `Here is your AI transformed photo from Gemini Magic Booth! 🎉\n\n${transformedImageUrl}`
    : `Thank you for visiting Gemini Magic Booth! 🎉`;
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleWhatsAppShare = async () => {
    try {
      // Try Web Share API to send the actual image file
      if (navigator.share && navigator.canShare) {
        const response = await fetch(transformedImageUrl);
        const blob = await response.blob();
        const file = new File([blob], `magic-booth-${selectedTheme?.id || 'photo'}.jpg`, { type: 'image/jpeg' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Gemini Magic Booth',
            text: 'Check out my AI transformed photo! 🎉',
            files: [file],
          });
          return;
        }
      }
    } catch (err: any) {
      // User cancelled share or share failed — fall back
      if (err?.name === 'AbortError') return;
    }
    // Fallback: open wa.me link
    window.open(whatsappUrl, '_blank');
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

      // Top-left logo
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.roundRect(margin, margin, logoW, logoH, 6);
      ctx.fill();
      const pad = 4;
      ctx.drawImage(logo1, margin + pad, margin + pad, logoW - pad * 2, logoH - pad * 2);

      // Bottom-right logo
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.roundRect(W - margin - logoW, H - margin - logoH, logoW, logoH, 6);
      ctx.fill();
      ctx.drawImage(logo2, W - margin - logoW + pad, H - margin - logoH + pad, logoW - pad * 2, logoH - pad * 2);

      // Bottom-left user name — stylish frosted pill
      if (userName) {
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

        // Gradient background pill
        const grad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
        grad.addColorStop(0, 'rgba(22, 163, 74, 0.9)');   // green-600
        grad.addColorStop(1, 'rgba(34, 197, 94, 0.9)');   // green-500
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
        ctx.fillStyle = grad;
        ctx.fill();

        // Subtle inner border
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Star icon
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(starText, pillX + 16, pillY + pillH - 14);

        // User name text
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
        <div class="logo-box tl"><img src="${logo1}" /></div>
        <div class="logo-box br"><img src="${logo2}" /></div>
        ${userName ? `<div class="user-name">✦ ${userName}</div>` : ''}
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
    <div className="h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white flex flex-col overflow-hidden print:bg-white print:block">
      <style>{`
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
      <header className="print:hidden flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/10 flex-shrink-0">
        <div>
          <h1 className="font-bold text-lg">✨ Your Transformation</h1>
          {selectedTheme && <p className="text-gray-400 text-xs">{selectedTheme.title}</p>}
        </div>
        <button onClick={onStartOver} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-semibold text-sm transition-colors shadow-md">
          <RotateCcw className="w-4 h-4" /> Start Over
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Image */}
        <div className="h-[60vh] lg:h-auto lg:flex-1 overflow-hidden flex-shrink-0 relative flex items-center justify-center bg-black">
          <img src={transformedImageUrl} alt="Transformed" className="result-image max-w-full max-h-full object-contain" style={{ aspectRatio: '2/3' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Actions */}
        <div className="print:hidden lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 p-4 lg:p-6 flex flex-col gap-3 lg:gap-4 overflow-y-auto bg-gray-950/80 backdrop-blur-sm">

          {/* Share / WhatsApp Button */}
          <button onClick={handleWhatsAppShare} className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 p-px shadow-lg hover:shadow-green-500/30 transition-shadow">
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 group-hover:from-green-500 group-hover:to-emerald-400 rounded-[11px] px-6 py-4 transition-all">
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-base">Share via WhatsApp</span>
            </div>
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
          </button>

          <button onClick={() => setShowEdit(!showEdit)} className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 p-px shadow-lg hover:shadow-blue-500/30 transition-shadow">
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 group-hover:from-blue-500 group-hover:to-cyan-400 rounded-[11px] px-6 py-4 transition-all">
              <Wand2 className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-base">Edit with AI</span>
            </div>
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
          </button>

          {showEdit && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 space-y-3">
              <Textarea
                placeholder="Describe the edit you want..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none h-20"
              />
              <button
                onClick={() => editFileRef.current?.click()}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-purple-300 transition-colors"
              >
                <Upload className="w-3 h-3" /> Add reference image
              </button>
              <input ref={editFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleEditRefImage} />
              {editRefs.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {editRefs.map((img, i) => (
                    <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20">
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

          <button onClick={onTryAnotherTheme} className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 p-px shadow-lg hover:shadow-pink-500/30 transition-shadow">
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-rose-500 group-hover:from-pink-500 group-hover:to-rose-400 rounded-[11px] px-6 py-4 transition-all">
              <RefreshCw className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-base">Try Another Theme</span>
            </div>
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
          </button>

          <button onClick={handleDownload} className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 p-px shadow-lg hover:shadow-violet-500/30 transition-shadow">
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-500 group-hover:from-violet-500 group-hover:to-purple-400 rounded-[11px] px-6 py-4 transition-all">
              <Download className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-base">Download</span>
            </div>
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
          </button>

          <button onClick={handlePrint} className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 p-px hover:shadow-gray-500/20 transition-shadow">
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-700 to-gray-600 group-hover:from-gray-600 group-hover:to-gray-500 rounded-[11px] px-6 py-4 transition-all">
              <Printer className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-base">Print</span>
            </div>
          </button>

          {/* Prominent Start Over — always visible at bottom */}
          <button onClick={onStartOver} className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-orange-500 p-px shadow-lg hover:shadow-red-500/30 transition-shadow mt-2">
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 group-hover:from-red-500 group-hover:to-orange-400 rounded-[11px] px-6 py-4 transition-all">
              <RotateCcw className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-base">Start Over</span>
            </div>
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
          </button>

        </div>
      </div>

    </div>
  );
}
