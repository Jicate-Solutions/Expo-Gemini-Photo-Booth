'use client';

import { Camera, Palette } from 'lucide-react';
import { CareerStyle } from '@/types';

interface CareerStylePickerProps {
  selected: CareerStyle;
  onChange: (style: CareerStyle) => void;
}

export default function CareerStylePicker({ selected, onChange }: CareerStylePickerProps) {
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-gray-300 mb-3">Choose Output Style</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onChange('photorealistic')}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
            selected === 'photorealistic'
              ? 'border-purple-500 bg-purple-900/30'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          }`}
        >
          <Camera className={`w-6 h-6 ${selected === 'photorealistic' ? 'text-purple-400' : 'text-gray-400'}`} />
          <span className="font-semibold text-sm">📷 Photorealistic</span>
          <span className="text-xs text-gray-400 text-center">Hyper-realistic portrait</span>
        </button>
        <button
          onClick={() => onChange('artistic')}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
            selected === 'artistic'
              ? 'border-purple-500 bg-purple-900/30'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          }`}
        >
          <Palette className={`w-6 h-6 ${selected === 'artistic' ? 'text-purple-400' : 'text-gray-400'}`} />
          <span className="font-semibold text-sm">🎨 Artistic</span>
          <span className="text-xs text-gray-400 text-center">Stylised illustration</span>
        </button>
      </div>
    </div>
  );
}
