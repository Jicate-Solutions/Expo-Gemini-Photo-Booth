'use client';

import { ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CareerStyle, Theme } from '@/types';

const TSHIRT_COLORS = ['red', 'blue', 'green', 'orange', 'purple', 'white', 'navy blue', 'maroon', 'teal', 'black'];

function buildMarathonTheme(userName: string): Theme {
  const color = TSHIRT_COLORS[Math.floor(Math.random() * TSHIRT_COLORS.length)];
  const nameOnShirt = userName.trim() || 'RUNNER';
  return {
    id: 'marathon-finish',
    title: 'Marathon Finish',
    type: 'fun',
    emoji: '🏅',
    prompt:
      'Transform this person into a triumphant marathon runner crossing the finish line. ' +
      'Keep the person\'s face, skin tone, and features exactly as they appear in the photo — do not alter or cartoon-ify the face. ' +
      'The person should have a natural, happy, proud smile — mouth relaxed or gently smiling, NOT wide open or shouting. ' +
      `They must be wearing a ${color} regular short-sleeved crew-neck t-shirt (not sleeveless, not a tank top) ` +
      `with the name "${nameOnShirt}" printed clearly on the chest. The t-shirt fits naturally for any gender. ` +
      'They are dramatically breaking through a bright finish line ribbon/tape with both arms raised in victory. ' +
      'Show a race number bib over the t-shirt, a crowd of cheering spectators in the background, ' +
      'confetti falling, and a large banner reading "FINISH" overhead. ' +
      'Ultra-realistic, high resolution, photographic quality, shot on a DSLR camera, natural lighting, ' +
      'no illustration, no cartoon, no painting — pure photorealism.',
  };
}

interface MarathonScreenProps {
  capturedPhoto: string;
  userName?: string;
  onTransform: (theme: Theme | null, customPrompt: string, careerStyle: CareerStyle, referenceImages: string[]) => void;
  onBack: () => void;
}

export default function MarathonScreen({ capturedPhoto, userName = '', onTransform, onBack }: MarathonScreenProps) {
  const handleCreate = () => {
    onTransform(buildMarathonTheme(userName), '', 'photorealistic', []);
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 gap-8">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="text-center">
        <span className="text-5xl">🏅</span>
        <h1 className="text-2xl font-bold mt-3">Marathon Finish</h1>
        <p className="text-gray-400 text-sm mt-1 max-w-xs">
          Your photo will be transformed into an epic marathon finish line moment!
        </p>
      </div>

      {/* Photo preview */}
      <div className="relative w-44 h-44 rounded-3xl overflow-hidden border-2 border-orange-500/50 shadow-2xl shadow-orange-900/30">
        <img src={capturedPhoto} alt="Your photo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Preview of what will happen */}
      <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 max-w-sm text-center">
        <p className="text-xs text-gray-400 leading-relaxed">
          🎽 Race bib &nbsp;·&nbsp; 🎀 Finish ribbon &nbsp;·&nbsp; 🎊 Confetti &nbsp;·&nbsp; 🏟️ Crowd cheering
        </p>
      </div>

      {/* Create button */}
      <div className="relative w-full max-w-sm">
        <div className="absolute inset-0 rounded-2xl bg-orange-500 blur-xl opacity-40" />
        <Button
          onClick={handleCreate}
          className="relative w-full bg-orange-500 hover:bg-orange-400 text-white font-black text-2xl px-10 py-8 rounded-2xl gap-3 shadow-lg shadow-orange-900/40 transition-all active:scale-95"
        >
          <Zap className="w-7 h-7" />
          Create My Finish!
        </Button>
      </div>
    </div>
  );
}
