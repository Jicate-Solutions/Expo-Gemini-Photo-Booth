'use client';

import { useState, useRef } from 'react';
import { QrCode, Wand2, RotateCcw, RefreshCw, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { QRCodeSVG } from 'qrcode.react';
import { Theme } from '@/types';

interface ResultScreenProps {
  transformedImageUrl: string;
  selectedTheme: Theme | null;
  onTryAnotherTheme: () => void;
  onStartOver: () => void;
  onEdit: (prompt: string, referenceImages: string[]) => void;
}

export default function ResultScreen({
  transformedImageUrl,
  selectedTheme,
  onTryAnotherTheme,
  onStartOver,
  onEdit,
}: ResultScreenProps) {
  const [showQR, setShowQR] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [editRefs, setEditRefs] = useState<string[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const isBase64 = transformedImageUrl.startsWith('data:');
  const downloadUrl = typeof window !== 'undefined' && !isBase64
    ? `${window.location.origin}/download?url=${encodeURIComponent(transformedImageUrl)}&theme=${encodeURIComponent(selectedTheme?.title || 'Custom')}`
    : '';

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
    <div className="h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
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
        <div className="flex-1 overflow-hidden">
          <img src={transformedImageUrl} alt="Transformed" className="w-full h-full object-cover" />
        </div>

        {/* Actions */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 p-6 flex flex-col gap-4">
          <Button onClick={() => setShowQR(true)} className="w-full bg-purple-600 hover:bg-purple-500 text-white gap-2 py-5 text-base font-semibold">
            <QrCode className="w-5 h-5" /> Scan QR to Download
          </Button>

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

        </div>
      </div>

      {/* QR Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="bg-gray-900 border-purple-500/30 text-white text-center max-w-sm">
          <h2 className="font-bold text-lg mb-2">Scan to Download</h2>
          {isBase64 ? (
            <div className="py-6">
              <p className="text-yellow-400 text-sm mb-2">⚠️ Storage not configured yet</p>
              <p className="text-gray-400 text-xs">The Supabase storage bucket needs to be created first. Please set up the &ldquo;transformations&rdquo; bucket in your Supabase dashboard to enable QR downloads.</p>
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-6">Scan this QR code with your phone to download your photo</p>
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG value={downloadUrl} size={200} />
                </div>
              </div>
            </>
          )}
          <Button onClick={() => setShowQR(false)} variant="outline" className="border-white/20">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
