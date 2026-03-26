'use client';

import { LogOut, RefreshCw, Plus, ArrowLeft } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onLogout: () => void;
  onRefresh?: () => void;
  onBack?: () => void;
  onCreateExpo?: () => void;
  refreshing?: boolean;
}

export default function AdminHeader({ title, subtitle, onLogout, onRefresh, onBack, onCreateExpo, refreshing }: AdminHeaderProps) {
  return (
    <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="font-bold text-xl text-white">{title}</h1>
          {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {onCreateExpo && (
          <button onClick={onCreateExpo}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Expo
          </button>
        )}
        {onRefresh && (
          <button onClick={onRefresh} disabled={refreshing}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        )}
        <button onClick={onLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </header>
  );
}
