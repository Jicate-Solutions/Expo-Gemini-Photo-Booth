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
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack ? (
            <button onClick={onBack}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors -ml-1"
              aria-label="Back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-3 pr-3 mr-1 border-r border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/jkkn-logo.png" alt="JKKN" className="h-8 w-auto object-contain" />
              <div className="hidden sm:flex w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-lg items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-lg text-slate-900 leading-tight tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onCreateExpo && (
            <button onClick={onCreateExpo}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-colors">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Expo</span>
            </button>
          )}
          {onRefresh && (
            <button onClick={onRefresh} disabled={refreshing}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-40">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {/* Admin user dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm px-2 py-1.5 rounded-xl transition-colors"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/70 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                  <p className="text-xs text-slate-500 mb-0.5">Signed in as</p>
                  <p className="text-sm text-slate-900 font-semibold truncate">{adminEmail || 'Admin'}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { setDropdownOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-2.5 text-left text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
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
