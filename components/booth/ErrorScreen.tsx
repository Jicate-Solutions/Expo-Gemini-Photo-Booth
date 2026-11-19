'use client';

import { AlertTriangle, Camera, CreditCard, Clock, RotateCcw } from 'lucide-react';

interface ErrorScreenProps {
  message: string;
  onStartOver: () => void;
  /** Optional: retake the selfie while keeping the details already entered (marathon stall flow) */
  onRetry?: () => void;
  /** Label for the start-over button (e.g. "Next Runner" in marathon) */
  startOverLabel?: string;
}

/** Turn the raw error into a clear heading + a hint for the booth staff. */
function describe(message: string) {
  const m = (message || '').toLowerCase();
  if (m.includes('credit')) {
    return {
      icon: CreditCard,
      title: 'AI credits used up',
      hint: 'Staff: the OpenAI API balance is empty. Add credits at platform.openai.com → Settings → Billing, then try again.',
      tone: 'amber' as const,
    };
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return { icon: Clock, title: 'Booth is busy', hint: 'Too many requests at once. Wait a few seconds and try again.', tone: 'amber' as const };
  }
  if (m.includes('timed out') || m.includes('timeout')) {
    return { icon: Clock, title: 'That took too long', hint: 'The AI service was slow. Please try again.', tone: 'amber' as const };
  }
  return { icon: AlertTriangle, title: 'Something went wrong', hint: '', tone: 'red' as const };
}

export default function ErrorScreen({ message, onStartOver, onRetry, startOverLabel = 'Start Over' }: ErrorScreenProps) {
  const info = describe(message);
  const tile = info.tone === 'amber'
    ? 'bg-amber-50 border-amber-200 text-amber-600'
    : 'bg-red-50 border-red-200 text-red-600';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 text-slate-900 flex items-center justify-center relative overflow-hidden p-5">
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-red-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-amber-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 text-center">
          <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl border flex items-center justify-center ${tile}`}>
            <info.icon className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{info.title}</h2>
          <p className="mt-2 text-slate-600 text-base leading-relaxed">{message}</p>

          {info.hint && (
            <p className="mt-4 text-left text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">
              {info.hint}
            </p>
          )}

          <div className="mt-8 space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/25 transition-colors"
              >
                <Camera className="w-5 h-5" /> Retake Selfie
              </button>
            )}
            <button
              onClick={onStartOver}
              className={`w-full flex items-center justify-center gap-2 h-12 rounded-xl font-semibold transition-colors ${
                onRetry
                  ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg'
              }`}
            >
              <RotateCcw className="w-5 h-5" /> {startOverLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
