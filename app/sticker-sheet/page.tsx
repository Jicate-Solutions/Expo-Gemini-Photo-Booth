'use client';

import { useState, useEffect } from 'react';
import { Printer, Trash2, Smartphone } from 'lucide-react';

export const STICKER_STORAGE_KEY = 'booth_sticker_sheet';
export const MAX_STICKERS = 20;

export interface StickerImage {
  id: string;
  url: string;
  name: string;
  theme: string;
  addedAt: string;
}

export default function PhotoPrintPage() {
  const [stickers, setStickers] = useState<StickerImage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STICKER_STORAGE_KEY);
    if (saved) setStickers(JSON.parse(saved));
    setLoaded(true);
  }, []);

  const deleteSticker = (id: string) => {
    const updated = stickers.filter(s => s.id !== id);
    setStickers(updated);
    localStorage.setItem(STICKER_STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    if (!confirm('Clear all photos?')) return;
    setStickers([]);
    localStorage.removeItem(STICKER_STORAGE_KEY);
  };

  const handlePrint = () => window.print();

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Screen UI (hidden during print) ── */}
      <div className="print:hidden">
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Photo Print</h1>
              <p className="text-gray-500 text-xs">{stickers.length} photo{stickers.length !== 1 ? 's' : ''} — each prints on its own page</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stickers.length > 0 && (
              <button onClick={clearAll}
                className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            )}
            <button onClick={handlePrint} disabled={stickers.length === 0}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <a href="/" className="text-gray-500 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
              ← Back to Booth
            </a>
          </div>
        </header>

        {/* Instructions */}
        <div className="px-6 py-4 bg-purple-900/10 border-b border-purple-500/10">
          <p className="text-gray-400 text-sm">
            Each photo prints on its own A4 page in portrait size. Delete any you don&apos;t want before printing.
          </p>
        </div>

        {/* Photo list on screen */}
        <div className="px-6 py-8">
          {stickers.length === 0 ? (
            <div className="text-center text-gray-600 py-20">
              <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No photos yet. Generate a transformation to add photos here.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6 justify-center">
              {stickers.map((sticker) => (
                <div key={sticker.id} className="flex flex-col items-center gap-2">
                  <div className="relative w-32 rounded-2xl overflow-hidden border-2 border-purple-500/40" style={{ aspectRatio: '9/16' }}>
                    <img src={sticker.url} alt={sticker.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => deleteSticker(sticker.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs text-center truncate w-32">{sticker.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Print Layout — one photo per 4x6 page ── */}
      <div className="hidden print:block">
        {stickers.map((sticker) => (
          <div key={sticker.id} className="print-page">
            <img src={sticker.url} alt={sticker.name} />
          </div>
        ))}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: 4in 6in;
            margin: 0;
          }
          body { background: white !important; margin: 0; padding: 0; }
          .print-page {
            width: 4in;
            height: 6in;
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-after: always;
            break-after: page;
            background: white;
          }
          .print-page img {
            width: 4in;
            height: 6in;
            object-fit: cover;
          }
        }
      `}</style>
    </div>
  );
}
