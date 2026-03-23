'use client';

import { useState, useEffect } from 'react';
import { Printer, Trash2, Images } from 'lucide-react';

export const STICKER_STORAGE_KEY = 'booth_sticker_sheet';
export const MAX_STICKERS = 12;

export interface StickerImage {
  id: string;
  url: string;
  name: string;
  theme: string;
  addedAt: string;
}

export default function StickerSheetPage() {
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
    if (!confirm('Clear all stickers from the sheet?')) return;
    setStickers([]);
    localStorage.removeItem(STICKER_STORAGE_KEY);
  };

  const handlePrint = () => window.print();

  if (!loaded) return null;

  const slots = Array.from({ length: MAX_STICKERS }, (_, i) => stickers[i] || null);

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Screen UI (hidden during print) ── */}
      <div className="print:hidden">
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
              <Images className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Sticker Sheet</h1>
              <p className="text-gray-500 text-xs">{stickers.length} / {MAX_STICKERS} filled — Print when ready</p>
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
              <Printer className="w-4 h-4" /> Print Sheet
            </button>
            <a href="/" className="text-gray-500 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
              ← Back to Booth
            </a>
          </div>
        </header>

        {/* Instructions */}
        <div className="px-6 py-4 bg-purple-900/10 border-b border-purple-500/10">
          <p className="text-gray-400 text-sm">
            Images are added automatically after each photo is generated. Delete any you don't want, then click <strong className="text-white">Print Sheet</strong>. After printing, cut out the circles and use as stickers.
          </p>
        </div>

        {/* Grid preview on screen */}
        <div className="px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-4 gap-6">
              {slots.map((sticker, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="relative w-32 h-32">
                    {sticker ? (
                      <>
                        <img
                          src={sticker.url}
                          alt={sticker.name}
                          className="w-32 h-32 rounded-full object-cover border-2 border-purple-500/40"
                        />
                        <button
                          onClick={() => deleteSticker(sticker.id)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </>
                    ) : (
                      <div className="w-32 h-32 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                        <span className="text-gray-700 text-xs">#{i + 1}</span>
                      </div>
                    )}
                  </div>
                  {sticker && (
                    <p className="text-gray-500 text-xs text-center truncate w-32">{sticker.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Print Layout (A4, visible only when printing) ── */}
      <div className="hidden print:block print-sheet">
        <div className="sticker-grid">
          {slots.map((sticker, i) => (
            <div key={i} className="sticker-circle">
              {sticker ? (
                <img src={sticker.url} alt={sticker.name} />
              ) : (
                <div className="sticker-empty" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body { background: white !important; }
          .print-sheet {
            width: 190mm;
            padding: 5mm;
          }
          .sticker-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8mm;
            width: 100%;
          }
          .sticker-circle {
            width: 42mm;
            height: 42mm;
            border-radius: 50%;
            overflow: hidden;
            border: 0.5mm dashed #ccc;
          }
          .sticker-circle img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .sticker-empty {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #f5f5f5;
          }
        }
      `}</style>
    </div>
  );
}
