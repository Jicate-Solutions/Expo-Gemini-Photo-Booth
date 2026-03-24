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
        <div className="h-[50vh] lg:h-auto lg:flex-1 overflow-hidden flex-shrink-0">
          <img src={transformedImageUrl} alt="Transformed" className="result-image w-full h-full object-cover" />
        </div>

        {/* Actions */}
        <div className="print:hidden lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 p-4 lg:p-6 flex flex-col gap-3 lg:gap-4 overflow-y-auto">

          {/* WhatsApp QR Button */}
          {cleanPhone && (
            <Button onClick={() => window.open(whatsappUrl, '_blank')} className="w-full bg-green-600 hover:bg-green-500 text-white gap-2 py-5 text-base font-semibold">
              <MessageCircle className="w-5 h-5" /> Send via WhatsApp
            </Button>
          )}

          <Button onClick={() => setShowEdit(!showEdit)} className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2 py-5 text-base font-semibold">
            <Wand2 className="w-5 h-5" /> Edit with AI
          </Button>

          {showEdit && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <Textarea
                placeholder="Describe the edit you want..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none h-20"
              />
              <button
                onClick={() => editFileRef.current?.click()}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-purple-300"
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
                className="w-full bg-purple-600 hover:bg-purple-700 text-sm gap-2"
              >
                <Wand2 className="w-4 h-4" /> Apply Edit
              </Button>
            </div>
          )}

          <Button onClick={onTryAnotherTheme} className="w-full bg-pink-600 hover:bg-pink-500 text-white gap-2 py-5 text-base font-semibold">
            <RefreshCw className="w-5 h-5" /> Try Another Theme
          </Button>

          <Button onClick={() => window.print()} className="w-full bg-gray-700 hover:bg-gray-600 text-white gap-2 py-5 text-base font-semibold">
            <Printer className="w-5 h-5" /> Print
          </Button>

        </div>
      </div>

    </div>
  );
}
