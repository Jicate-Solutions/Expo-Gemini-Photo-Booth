'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, RefreshCw, Plus, ArrowLeft, User, ChevronDown, LayoutDashboard } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  adminEmail?: string;
  onLogout: () => void;
  onRefresh?: () => void;
  onBack?: () => void;
  onCreateExpo?: () => void;
  refreshing?: boolean;
}

export default function AdminHeader({ title, subtitle, adminEmail, onLogout, onRefresh, onBack, onCreateExpo, refreshing }: AdminHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-1 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-purple-400" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">{title}</h1>
            {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCreateExpo && (
            <button onClick={onCreateExpo}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> New Expo
            </button>
          )}
          {onRefresh && (
            <button onClick={onRefresh} disabled={refreshing}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-40">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {/* Admin user dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm px-2.5 py-2 rounded-xl transition-colors"
            >
              <div className="w-6 h-6 bg-purple-600/30 border border-purple-500/40 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-purple-300" />
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-xs text-gray-500 mb-0.5">Signed in as</p>
                  <p className="text-sm text-white font-medium truncate">{adminEmail || 'Admin'}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { setDropdownOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-2.5 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
