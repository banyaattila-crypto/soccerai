import React from 'react';
import { Activity, ShieldCheck, Sparkles, SlidersHorizontal, Ticket } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenBetSlip: () => void;
  betSlipCount: number;
  activeTab: 'grid' | 'picks' | 'results';
  setActiveTab: (tab: 'grid' | 'picks' | 'results') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenBetSlip,
  betSlipCount,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#070B14]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-600 p-[1px] shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-[#0A101D] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent">
                TippMester<span className="text-amber-400">.ai</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                PRO HU
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              AI Futball Predikciók & Valószínűségi Hőtérkép
            </p>
          </div>
        </div>

        {/* Live model status badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-medium">ÉLŐ ADATOK &bull; 2026. OKTÓBER 17.</span>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex items-center gap-1 bg-slate-900/70 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Statisztikai Rács
            </button>
            <button
              onClick={() => setActiveTab('picks')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'picks'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Napi Top AI Tippek
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'results'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Eredmények
            </button>
          </nav>

          {/* Szelvény számláló gomb */}
          <button
            onClick={onOpenBetSlip}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-medium text-slate-200 transition-colors"
            title="Szelvényépítő megnyitása"
          >
            <Ticket className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Szelvény</span>
            {betSlipCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold">
                {betSlipCount}
              </span>
            )}
          </button>

          {/* Beállítások */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="Beállítások és API forrás"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
