'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Wand2, Upload, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { funThemes } from '@/lib/themes';
import { careerThemes } from '@/lib/career-themes';
import { Theme, CareerStyle } from '@/types';

interface ThemeSelectionScreenProps {
  capturedPhoto: string;
  onTransform: (theme: Theme | null, customPrompt: string, careerStyle: CareerStyle, referenceImages: string[]) => void;
  onBack: () => void;
}

export default function ThemeSelectionScreen({ capturedPhoto, onTransform, onBack }: ThemeSelectionScreenProps) {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [careerSearch, setCareerSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const funCategories = Array.from(new Set(funThemes.map((t) => t.category!)));
  const filteredCareerThemes = careerSearch.trim()
    ? careerThemes.filter((t) =>
        t.title.toLowerCase().includes(careerSearch.toLowerCase()) ||
        t.category!.toLowerCase().includes(careerSearch.toLowerCase())
      )
    : careerThemes;
  const careerCategories = Array.from(new Set(filteredCareerThemes.map((t) => t.category!)));

  const handleAddRefImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setReferenceImages((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const canTransform = selectedTheme !== null || customPrompt.trim().length > 0;

  const handleTransform = () => {
    if (!canTransform) return;
    onTransform(selectedTheme, customPrompt, 'photorealistic', referenceImages);
  };

  const ThemeCard = ({ theme }: { theme: Theme }) => {
    const isSelected = selectedTheme?.id === theme.id;
    return (
      <button
        onClick={() => setSelectedTheme(theme)}
        className={`relative group rounded-2xl overflow-hidden aspect-[3/4] min-h-[80px] bg-gray-800 transition-all duration-300 ${
          isSelected
            ? 'ring-4 ring-purple-400 scale-105 shadow-2xl shadow-purple-500/50'
            : 'hover:scale-103 hover:ring-2 hover:ring-white/40'
        }`}
        style={{ transform: isSelected ? 'scale(1.05)' : undefined }}
      >
        <img
          src={theme.bgImage}
          alt={theme.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://picsum.photos/seed/${theme.id}/400/500`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        {isSelected && <div className="absolute inset-0 bg-purple-600/20" />}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-bold text-xs leading-tight uppercase tracking-wide drop-shadow-lg">
            {theme.title}
          </p>
          <span className="text-base">{theme.emoji}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      <header className="flex items-center gap-4 px-6 py-3 border-b border-white/10 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-bold text-lg">Choose Your Transformation</h1>
          <p className="text-gray-400 text-xs">150+ epic themes await</p>
        </div>
        {selectedTheme && (
          <div className="ml-auto flex items-center gap-2 bg-purple-900/40 border border-purple-500/40 rounded-xl px-3 py-1.5">
            <span className="text-sm">{selectedTheme.emoji}</span>
            <span className="text-purple-300 text-sm font-medium">{selectedTheme.title}</span>
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* Left sidebar — Photo + Transform */}
        <div className="w-44 flex-shrink-0 p-4 flex flex-col items-center gap-3 border-r border-white/10">
          <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-lg shadow-purple-900/30">
            <img src={capturedPhoto} alt="Your photo" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs text-gray-400 text-center">Your photo</p>
          <Button
            onClick={handleTransform}
            disabled={!canTransform}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 gap-1.5 py-5 text-sm rounded-xl mt-auto"
          >
            <Wand2 className="w-4 h-4" />
            Transform!
          </Button>
        </div>

        {/* Two columns side by side */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── Fun & Fantasy column ── */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-white/10">
            {/* Column header */}
            <div className="flex-shrink-0 px-3 pt-3 pb-2 bg-[#0d0514] border-b border-violet-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-violet-300 flex items-center gap-1.5">
                  ✨ Fun &amp; Fantasy
                </span>
                <span className="text-[10px] text-violet-400 bg-violet-500/15 border border-violet-500/20 px-2 py-0.5 rounded-full font-semibold">
                  {funThemes.length}+ THEMES
                </span>
              </div>
            </div>
            {/* Scrollable themes */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 bg-[#0d0514]/50">
              {funCategories.map((cat) => (
                <div key={cat} className="mb-3 mt-3">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span className="flex-1 h-px bg-white/10" />{cat}<span className="flex-1 h-px bg-white/10" />
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
                    {funThemes.filter((t) => t.category === cat).map((theme) => (
                      <ThemeCard key={theme.id} theme={theme} />
                    ))}
                  </div>
                </div>
              ))}
              {/* Custom prompt */}
              <div className="mt-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                <label className="text-xs font-semibold text-gray-300 mb-1.5 block">✍️ Custom Prompt</label>
                <Textarea
                  placeholder="e.g. Transform me into a royal Indian bride..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none h-14 text-xs"
                />
                <div className="mt-1.5">
                  <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-300">
                    <Upload className="w-3 h-3" /> Add reference images
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddRefImage} />
                  {referenceImages.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {referenceImages.map((img, i) => (
                        <div key={i} className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/20">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => setReferenceImages((prev) => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-black/60 rounded-bl-lg p-0.5">
                            <X className="w-2.5 h-2.5 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Career Themes column ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Column header */}
            <div className="flex-shrink-0 px-3 pt-3 pb-2 bg-[#050d1a] border-b border-sky-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-sky-300 flex items-center gap-1.5">
                  💼 Career Themes
                </span>
                <span className="text-[10px] text-sky-400 bg-sky-500/15 border border-sky-500/20 px-2 py-0.5 rounded-full font-semibold">
                  {careerThemes.length}+ ROLES
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search career (e.g. Doctor, Pilot...)"
                  value={careerSearch}
                  onChange={(e) => setCareerSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-sky-500/50"
                />
                {careerSearch && (
                  <button onClick={() => setCareerSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            {/* Scrollable themes */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 bg-[#050d1a]/50">
              {filteredCareerThemes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                  <Search className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No results for &ldquo;{careerSearch}&rdquo;</p>
                </div>
              ) : (
                careerCategories.map((cat) => (
                  <div key={cat} className="mb-3 mt-3">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <span className="flex-1 h-px bg-white/10" />{cat}<span className="flex-1 h-px bg-white/10" />
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
                      {filteredCareerThemes.filter((t) => t.category === cat).map((theme) => (
                        <ThemeCard key={theme.id} theme={theme} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
