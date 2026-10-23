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
  Lock,
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
  liveMatchCount?: number;
  onGoToLive?: () => void;
  isPinEnabled?: boolean;
  onLockApp?: () => void;
}

interface NavItem {
  tab: AppTab;
  label: string;
  shortLabel: string;
  icon: React.ReactElement<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    tab: 'picks',
    label: 'Napi Top Tippek',
    shortLabel: 'Top',
    icon: <Flame className="w-3.5 h-3.5 shrink-0" />,
  },
  {
    tab: 'grid',
    label: 'Mérkőzés',
    shortLabel: 'Mérkőzés',
    icon: <LayoutGrid className="w-3.5 h-3.5 shrink-0" />,
  },
  {
    tab: 'scanner',
    label: 'Scanner (+EV)',
    shortLabel: 'Scan',
    icon: <Radar className="w-3.5 h-3.5 shrink-0" />,
  },
  {
    tab: 'results',
    label: 'Eredmények & Audit',
    shortLabel: 'Eredmény',
    icon: <Trophy className="w-3.5 h-3.5 shrink-0" />,
  },
  {
    tab: 'bankroll',
    label: 'Tétnapló',
    shortLabel: 'Bankroll',
    icon: <Wallet className="w-3.5 h-3.5 shrink-0" />,
  },
  {
    tab: 'methodology',
    label: 'Módszertan',
    shortLabel: 'Elmélet',
    icon: <BookOpen className="w-3.5 h-3.5 shrink-0" />,
  },
];

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
  liveMatchCount,
  onGoToLive,
  isPinEnabled,
  onLockApp,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Ellenőrizzük, hogy standalone PWA módban fut-e az alkalmazás
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <header className="sticky top-0 z-40 bg-mesh-header backdrop-blur-md border-b border-slate-800/80 w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* 1. Emelet: Márka & Fő Műveletek (Soha nem ütközik a navigációval!) */}
        <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
          
          {/* Bal oldal: 3D Focilabda Logó, Név, Verzió & Státusz */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
            <Logo size={42} className="shrink-0" />
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 flex-nowrap">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent shrink-0">
                  Soccer<span className="text-amber-400">AI</span>
                </span>
                <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                  PRO
                </span>
                <button
                  type="button"
                  onClick={onOpenAbout}
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition-colors shrink-0 cursor-pointer"
                  title={`Verzió: v${APP_VERSION} (Kattints a névjegyhez)`}
                >
                  v{APP_VERSION}
                </button>
                {isLiveApi ? (
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30 shrink-0 hidden sm:inline-flex items-center gap-1"
                    title="Élő API adatforrás (Football-Data.org / API-Sports)"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                    ÉLŐ API
                  </span>
                ) : (
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0 hidden sm:inline-block"
                    title="Szimulált vagy gyorsítótárazott minta adatok"
                  >
                    SZIMULÁLT
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate hidden md:block">
                Kvantitatív Futball Predikciók &amp; Valószínűségi Hőtérkép
              </p>
            </div>
          </div>

          {/* Jobb oldal: Műveletek (Élő kapszula, Bankroll chip, Szelvény, Frissítés, PIN zár, Beállítások) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Élő Mérkőzés Pulzáló Kapszula */}
            {liveMatchCount !== undefined && liveMatchCount > 0 ? (
              <button
                type="button"
                onClick={onGoToLive}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 transition-all cursor-pointer shadow-sm shadow-red-950/40 animate-pulse shrink-0"
                title={`${liveMatchCount} élő mérkőzés folyamatban! Kattints az élő meccsekhez.`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-red-200 flex items-center gap-1">
                  <span>ÉLŐ</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono text-[9px] sm:text-[10px]">
                    {liveMatchCount}
                  </span>
                </span>
              </button>
            ) : null}

            {/* Live Bankroll Chip */}
            {currentBankroll !== undefined && (
              <button
                type="button"
                onClick={() => setActiveTab('bankroll')}
                className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'bankroll'
                    ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
                title="Saját Bankroll & Tétnapló megnyitása"
              >
                <Wallet className="w-3.5 h-3.5 text-brand-400" />
                <span>{currentBankroll.toLocaleString('hu-HU')} Ft</span>
              </button>
            )}

            {/* PWA Telepítés gomb */}
            {installPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-[11px] shadow-md shadow-brand-600/25 transition-all cursor-pointer animate-pulse shrink-0"
                title="SoccerAI telepítése natív alkalmazásként"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Telepítés</span>
              </button>
            )}

            {isStandalone && (
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-400 text-[10px] font-bold">
                <Smartphone className="w-3 h-3" />
                PWA
              </span>
            )}

            {/* Frissítés gomb */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              title="Mérkőzések frissítése most"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-brand-400 ${isLoading ? 'animate-spin' : ''}`}
              />
              <span className="hidden xl:inline">{isLoading ? 'Frissül...' : 'Frissítés'}</span>
            </button>

            {/* Szelvény számláló gomb */}
            <button
              type="button"
              onClick={onOpenBetSlip}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                betSlipCount > 0
                  ? 'bg-brand-600 hover:bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-600/25'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Szelvényépítő megnyitása"
            >
              <Ticket className="w-3.5 h-3.5 text-brand-300" />
              <span className="hidden sm:inline">Szelvény</span>
              {betSlipCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white text-slate-950 text-[10px] sm:text-xs font-black">
                  {betSlipCount}
                </span>
              )}
            </button>

            {/* Azonnali Zárolás Gomb (ha a 6-jegyű PIN aktív) */}
            {isPinEnabled && onLockApp && (
              <button
                type="button"
                onClick={onLockApp}
                className="p-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer shrink-0"
                title="Alkalmazás azonnali zárolása (6-jegyű PIN)"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Névjegy & Rendszerinfó */}
            <button
              type="button"
              onClick={onOpenAbout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-brand-300 border border-slate-800 transition-colors cursor-pointer shrink-0"
              title={`Névjegy & Rendszerinfó (v${APP_VERSION})`}
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Beállítások */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer shrink-0"
              title="Beállítások & API kulcs"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Emelet: Dedikált Fő Navigációs Sáv (Kényelmes, átlátható, tágas elrendezés) */}
        <div className="pb-2 sm:pb-2.5 pt-0.5 border-t border-slate-800/50">
          
          {/* Asztali / Tablet nézet (>= md): Középre rendezett szalag */}
          <nav className="hidden md:flex items-center justify-center">
            <div className="inline-flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shadow-inner">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => setActiveTab(item.tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-extrabold scale-[1.02]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Mobilon megjelenő kompakt 6-oszlopos Tab-sáv (< md) */}
          <nav className="grid grid-cols-6 gap-1 md:hidden bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 text-center">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className={`py-1.5 px-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all truncate flex items-center justify-center gap-1 cursor-pointer ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>

        </div>

      </div>
    </header>
  );
};
