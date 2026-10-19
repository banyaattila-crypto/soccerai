import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Ticket,
  RefreshCw,
  Info,
  Flame,
  LayoutGrid,
  Trophy,
  BookOpen,
  Download,
  Smartphone,
  Wallet,
  Radar,
} from 'lucide-react';
import { Logo } from './Logo';
import { APP_VERSION } from '../version';

export type AppTab = 'picks' | 'grid' | 'scanner' | 'results' | 'bankroll' | 'methodology';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenBetSlip: () => void;
  betSlipCount: number;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isLiveApi: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  currentBankroll?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenAbout,
  onOpenBetSlip,
  betSlipCount,
  activeTab,
  setActiveTab,
  isLiveApi,
  isLoading,
  onRefresh,
  currentBankroll,
}) => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Ellenőrizzük, hogy standalone PWA módban fut-e az alkalmazás
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-mesh-header backdrop-blur-md border-b border-slate-800/80 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Felső Fő Sáv */}
        <div className="h-15 sm:h-16 flex items-center justify-between gap-2">
          {/* Bal oldal: 3D WOW Focilabda Logó & Cím */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo size={38} className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent truncate">
                  Soccer<span className="text-amber-400">AI</span>
                </span>
                <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                  PRO
                </span>
                <button
                  onClick={onOpenAbout}
                  className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition-all shrink-0 cursor-pointer"
                  title={`Verzió: v${APP_VERSION} (Kattints a névjegyhez)`}
                >
                  v{APP_VERSION}
                </button>
                {isLiveApi ? (
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 hidden sm:inline"
                    title="Élő API adatforrás (Football-Data / API-Sports)"
                  >
                    ÉLŐ API
                  </span>
                ) : (
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0 hidden sm:inline"
                    title="Szimulált vagy gyorsítótárazott minta adatok"
                  >
                    SZIMULÁLT
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate hidden sm:block">
                Kvantitatív Futball Predikciók &amp; Valószínűségi Hőtérkép
              </p>
            </div>
          </div>

          {/* Közép (asztali nézet): 5 Fókuszált Tab */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/95 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('picks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'picks'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Napi Top Tippek</span>
            </button>

            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Mérkőzés Rács</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Scanner (+EV)</span>
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'results'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Eredmények</span>
            </button>

            <button
              onClick={() => setActiveTab('bankroll')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bankroll'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Tétnapló</span>
            </button>

            <button
              onClick={() => setActiveTab('methodology')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'methodology'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Módszertan</span>
            </button>
          </nav>

          {/* Jobb oldal: Műveletek (Bankroll chip, Frissítés, Szelvény, Névjegy, Beállítások) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Bankroll Chip */}
            {currentBankroll !== undefined && (
              <button
                onClick={() => setActiveTab('bankroll')}
                className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'bankroll'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
                title="Saját Bankroll & Tétnapló megnyitása"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentBankroll.toLocaleString('hu-HU')} Ft</span>
              </button>
            )}

            {/* PWA Telepítés gomb vagy Natív PWA badge */}
            {installPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] shadow-md shadow-emerald-600/25 transition-all cursor-pointer animate-pulse"
                title="SoccerAI telepítése natív alkalmazásként"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Telepítés</span>
              </button>
            )}

            {isStandalone && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <Smartphone className="w-3 h-3" />
                PWA Mód
              </span>
            )}

            {/* Frissítés gomb */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
              title="Mérkőzések frissítése most"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`}
              />
              <span className="hidden xl:inline">{isLoading ? 'Frissül...' : 'Frissítés'}</span>
            </button>

            {/* Szelvény számláló gomb */}
            <button
              onClick={onOpenBetSlip}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                betSlipCount > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Szelvényépítő megnyitása"
            >
              <Ticket className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Szelvény</span>
              {betSlipCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white text-slate-950 text-[10px] sm:text-xs font-black">
                  {betSlipCount}
                </span>
              )}
            </button>

            {/* Névjegy & Rendszerinfó */}
            <button
              onClick={onOpenAbout}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border border-slate-800 transition-colors cursor-pointer"
              title={`Névjegy & Rendszerinfó (v${APP_VERSION})`}
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Beállítások */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
              title="Beállítások & API kulcs"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobilon megjelenő másodlagos kompakt 6-oszlopos Tab-sáv */}
        <div className="md:hidden pb-2 pt-0.5">
          <nav className="grid grid-cols-6 gap-1 bg-slate-900/95 p-1 rounded-xl border border-slate-800/90 text-center">
            <button
              onClick={() => setActiveTab('picks')}
              className={`py-1.5 px-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all truncate flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'picks'
                  ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3 shrink-0" />
              <span className="truncate">Top</span>
            </button>

            <button
              onClick={() => setActiveTab('grid')}
              className={`py-1.5 px-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all truncate flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3 h-3 shrink-0" />
              <span className="truncate">Rács</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`py-1.5 px-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all truncate flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radar className="w-3 h-3 shrink-0" />
              <span className="truncate">Scan</span>
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`py-1.5 px-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all truncate flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'results'
                  ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3 h-3 shrink-0" />
              <span className="truncate">Eredmény</span>
            </button>

            <button
              onClick={() => setActiveTab('bankroll')}
              className={`py-1.5 px-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all truncate flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'bankroll'
                  ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wallet className="w-3 h-3 shrink-0" />
              <span className="truncate">Bankroll</span>
            </button>

            <button
              onClick={() => setActiveTab('methodology')}
              className={`py-1.5 px-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all truncate flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'methodology'
                  ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3 h-3 shrink-0" />
              <span className="truncate">Módszer</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
