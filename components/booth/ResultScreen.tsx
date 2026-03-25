'use client';

import { useState, useRef } from 'react';
import { Wand2, RotateCcw, RefreshCw, X, Upload, MessageCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Theme } from '@/types';

interface ResultScreenProps {
  transformedImageUrl: string;
  selectedTheme: Theme | null;
  userMobile: string;
  onTryAnotherTheme: () => void;
  onStartOver: () => void;
  onEdit: (prompt: string, referenceImages: string[]) => void;
}

export default function ResultScreen({
  transformedImageUrl,
  selectedTheme,
  userMobile,
  onTryAnotherTheme,
  onStartOver,
  onEdit,
}: ResultScreenProps) {
  const [editPrompt, setEditPrompt] = useState('');
  const [editRefs, setEditRefs] = useState<string[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Clean phone number and build WhatsApp URL
  const cleanPhone = userMobile.replace(/\D/g, '');
  // Always use 91 (India) as default — skip if number already starts with 91
  const whatsappPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  // Include image URL in message if it's a public URL (not base64)
  const isPublicUrl = transformedImageUrl && !transformedImageUrl.startsWith('data:');
  const uploadError = null;
  const whatsappMessage = isPublicUrl
    ? `Here is your AI transformed photo from Gemini Magic Booth! 🎉\n\n${transformedImageUrl}`
    : `Thank you for visiting Gemini Magic Booth! 🎉`;
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleDownload = async () => {
    try {
      const res = await fetch(transformedImageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gemini-magic-booth-${selectedTheme?.id || 'custom'}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
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
      @page { margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100vw; height: 100vh; overflow: hidden; background: white; }
      .frame { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
      .photo { display: block; width: 100%; height: 100%; object-fit: cover; }
      .logo-tl { position: absolute; top: 3%; left: 3%; width: 22%; }
      .logo-br { position: absolute; bottom: 3%; right: 3%; width: 18%; }
    </style></head><body>
      <div class="frame">
        <img class="photo" src="${transformedImageUrl}" />
        <img class="logo-tl" src="${logo1}" />
        <img class="logo-br" src="${logo2}" />
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
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .result-image {
            width: 210mm;
            height: 297mm;
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
        <Button variant="ghost" size="sm" onClick={onStartOver} className="text-gray-400 gap-1">
          <RotateCcw className="w-4 h-4" /> Start Over
        </Button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Image */}
        <div className="h-[50vh] lg:h-auto lg:flex-1 overflow-hidden flex-shrink-0 relative">
          <img src={transformedImageUrl} alt="Transformed" className="result-image w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Actions */}
        <div className="print:hidden lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 p-4 lg:p-6 flex flex-col gap-3 lg:gap-4 overflow-y-auto bg-gray-950/80 backdrop-blur-sm">

          {/* WhatsApp Button */}
          {cleanPhone && (
            <button onClick={() => window.open(whatsappUrl, '_blank')} className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 p-px shadow-lg hover:shadow-green-500/30 transition-shadow">
              <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 group-hover:from-green-500 group-hover:to-emerald-400 rounded-[11px] px-6 py-4 transition-all">
                <MessageCircle className="w-5 h-5 text-white" />
                <span className="text-white font-semibold text-base">Send via WhatsApp</span>
              </div>
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
            </button>
          )}

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

          <button onClick={handlePrint} className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 p-px hover:shadow-gray-500/20 transition-shadow">
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-700 to-gray-600 group-hover:from-gray-600 group-hover:to-gray-500 rounded-[11px] px-6 py-4 transition-all">
              <Printer className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-base">Print</span>
            </div>
          </button>

        </div>
      </div>

    </div>
  );
}
