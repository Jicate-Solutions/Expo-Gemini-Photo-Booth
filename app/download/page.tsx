'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Download, Phone, Mail, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

function DownloadContent() {
  const params = useSearchParams();
  const imageUrl = params.get('url') || '';
  const theme = params.get('theme') || 'Your Transformation';

  const handleDownload = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gemini-magic-booth-${theme.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white">
      {/* Sticky download button */}
      <div className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-white/10 p-4">
        <Button
          onClick={handleDownload}
          className="w-full bg-green-600 hover:bg-green-700 gap-2 py-5 text-base font-bold rounded-xl"
        >
          <Download className="w-5 h-5" />
          Download Your Photo
        </Button>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">✨ Gemini Magic Booth</h1>
          <p className="text-purple-300 text-sm">{theme}</p>
        </div>

        {imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl shadow-purple-900/40 mb-8 relative">
            <img src={imageUrl} alt="Your transformation" className="w-full h-auto" />
            <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
              <p className="text-white text-xs font-semibold">✨ Gemini Magic Booth</p>
              <p className="text-gray-300 text-[10px]">by Jicate Solutions</p>
            </div>
          </div>
        )}

        {/* Jicate Branding */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-bold text-purple-300 mb-1">Jicate Solutions</h2>
          <p className="text-gray-400 text-sm italic mb-4">
            &ldquo;SHAPE YOUR FUTURE..! PARTNER WITH JICATE..!&rdquo;
          </p>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" />
              <span>info@jicate.solutions</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Phone className="w-4 h-4 text-purple-400" />
              <span>+91 90254 49944</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>www.jicate.solutions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>}>
      <DownloadContent />
    </Suspense>
  );
}
