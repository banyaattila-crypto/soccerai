import React from 'react';
import { SlidersHorizontal, Ticket, RefreshCw } from 'lucide-react';
import { Logo } from './Logo';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenBetSlip: () => void;
  betSlipCount: number;
  activeTab: 'grid' | 'picks' | 'results';
  setActiveTab: (tab: 'grid' | 'picks' | 'results') => void;
  isLiveApi: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenBetSlip,
  betSlipCount,
  activeTab,
  setActiveTab,
  isLiveApi,
  isLoading,
  onRefresh,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#070B14]/95 backdrop-blur-md border-b border-slate-800/80 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Felső Fő Sáv */}
        <div className="h-16 flex items-center justify-between gap-2">
          
          {/* Bal oldal: 3D WOW Focilabda Logó & Cím */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo size={40} className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent truncate">
                  Soccer<span className="text-amber-400">AI</span>
                </span>
                <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate hidden sm:block">
                Kvantitatív Futball Predikciók &amp; Valószínűségi Hőtérkép
              </p>
            </div>
          </div>

          {/* Közép (csak asztalon): Tab Navigáció */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Statisztikai Rács
            </button>
            <button
              onClick={() => setActiveTab('picks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'picks'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Napi Top AI Tippek
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'results'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Eredmények
            </button>
          </nav>

          {/* Jobb oldal: Műveletek (Frissítés, Szelvény, Beállítások) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Frissítés gomb */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 transition-colors disabled:opacity-50"
              title="Mérkőzések frissítése most"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Frissül...' : 'Frissítés'}</span>
            </button>

            {/* Szelvény számláló gomb */}
            <button
              onClick={onOpenBetSlip}
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
              title="Szelvényépítő megnyitása"
            >
              <Ticket className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Szelvény</span>
              {betSlipCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] sm:text-xs font-black">
                  {betSlipCount}
                </span>
              )}
            </button>

            {/* Beállítások */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
              title="Beállítások & API kulcs"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobilon megjelenő másodlagos kompakt Tab-sáv (sosem lóg ki!) */}
        <div className="md:hidden pb-2.5 pt-0.5">
          <nav className="grid grid-cols-3 gap-1 bg-slate-900/95 p-1 rounded-xl border border-slate-800/90 text-center">
            <button
              onClick={() => setActiveTab('grid')}
              className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all truncate ${
                activeTab === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rács
            </button>
            <button
              onClick={() => setActiveTab('picks')}
              className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all truncate ${
                activeTab === 'picks'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Top Tippek
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all truncate ${
                activeTab === 'results'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Eredmények
            </button>
          </nav>
        </div>

      </div>
    </header>
  );
};
