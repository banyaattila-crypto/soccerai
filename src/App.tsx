import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Match, DayFilter, BetSlipItem } from './types/football';
import { MOCK_MATCHES, LEAGUES } from './data/mockMatches';
import { fetchLiveMatches } from './services/footballDataApi';
import { Header } from './components/Header';
import { HeroKpi } from './components/HeroKpi';
import { TopPicks } from './components/TopPicks';
import { StatsGrid } from './components/StatsGrid';
import { MatchDetailModal } from './components/MatchDetailModal';
import { BetSlipDrawer } from './components/BetSlipDrawer';
import { SettingsModal } from './components/SettingsModal';
import { ResultsView } from './components/ResultsView';
import { Logo } from './components/Logo';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

const DEFAULT_API_KEY = '0a2ff5ef40ed4113a0ca28d6b9b122d8';

export function App() {
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [activeTab, setActiveTab] = useState<'grid' | 'picks' | 'results'>('grid');
  const [dayFilter, setDayFilter] = useState<DayFilter>('today');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [betSlipOpen, setBetSlipOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [betSlipItems, setBetSlipItems] = useState<BetSlipItem[]>([]);

  // API állapotok
  const [dataSource, setDataSource] = useState<'builtin' | 'api'>(() => {
    return (localStorage.getItem('focitipp_datasource') as 'builtin' | 'api') || 'api';
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('focitipp_apikey') || DEFAULT_API_KEY;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiSuccessNotice, setApiSuccessNotice] = useState<string | null>(null);

  // Élő meccsek betöltése
  const loadMatches = useCallback(
    async (source: 'builtin' | 'api', key: string, forceRefresh: boolean = false) => {
      if (source === 'builtin') {
        setMatches(MOCK_MATCHES);
        setApiSuccessNotice(null);
        return;
      }

      setIsLoading(true);
      try {
        const live = await fetchLiveMatches(key, forceRefresh);
        if (live && live.length > 0) {
          setMatches(live);
          setApiSuccessNotice(
            `Sikeres szinkronizáció! ${live.length} valós mai és közelgő meccs betöltve a Football-Data.org API-ról.`
          );
        } else {
          setMatches(MOCK_MATCHES);
        }
      } catch (err) {
        console.warn('API lekérési hiba, offline adatokra visszatérés:', err);
        // Hiba esetén megtartjuk vagy visszatöltjük a stabil mintaadatokat
        setMatches(MOCK_MATCHES);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Első betöltéskor
  useEffect(() => {
    loadMatches(dataSource, apiKey, false);
  }, [dataSource, apiKey, loadMatches]);

  // Értesítés eltüntetése 5mp után
  useEffect(() => {
    if (apiSuccessNotice) {
      const t = setTimeout(() => setApiSuccessNotice(null), 5000);
      return () => clearTimeout(t);
    }
  }, [apiSuccessNotice]);

  // Automatikus háttérfrissítés 10 percenként, ha a fül látható/aktív
  useEffect(() => {
    if (dataSource !== 'api') return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadMatches('api', apiKey, true);
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dataSource, apiKey, loadMatches]);

  const handleRefresh = () => {
    loadMatches(dataSource, apiKey, true);
  };

  const handleSaveConfig = (newSource: 'builtin' | 'api', newKey: string) => {
    setDataSource(newSource);
    setApiKey(newKey);
    loadMatches(newSource, newKey, true);
  };

  // Szelvényhez adás (duplikáció szűréssel)
  const handleAddToBetSlip = (item: BetSlipItem) => {
    setBetSlipItems((prev) => {
      const exists = prev.some(
        (i) => i.matchId === item.matchId && i.marketLabel === item.marketLabel
      );
      if (exists) {
        return prev.filter(
          (i) => !(i.matchId === item.matchId && i.marketLabel === item.marketLabel)
        );
      }
      return [...prev, item];
    });
  };

  const handleRemoveBetSlipItem = (index: number) => {
    setBetSlipItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearBetSlip = () => {
    setBetSlipItems([]);
  };

  // Dinamikus KPI kalkulációk a mai meccsekből
  const todayDateStr = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const todayMatches = useMemo(() => {
    const t = matches.filter((m) => m.kickoffDate === todayDateStr || m.status === 'LIVE');
    return t.length > 0 ? t : matches;
  }, [matches, todayDateStr]);

  const distinctLeagueCount = useMemo(() => {
    const set = new Set(matches.map((m) => m.leagueId));
    return set.size > 0 ? set.size : LEAGUES.length;
  }, [matches]);

  const strongSignalsCount = useMemo(() => {
    let count = 0;
    todayMatches.forEach((m) => {
      const p = m.probabilities;
      if (p.homeWin >= 60) count++;
      if (p.awayWin >= 60) count++;
      if (p.bttsYes >= 60) count++;
      if (p.over25 >= 60) count++;
    });
    return count;
  }, [todayMatches]);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. Felső Navigációs Sáv */}
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenBetSlip={() => setBetSlipOpen(true)}
        betSlipCount={betSlipItems.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLiveApi={dataSource === 'api'}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* Sikeres API csatlakozás banner */}
      {apiSuccessNotice && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{apiSuccessNotice}</span>
        </div>
      )}

      {/* 2. Hero Szekció KPI Mutatókkal & Jelmagyarázattal */}
      <HeroKpi
        matchCount={todayMatches.length}
        leagueCount={distinctLeagueCount}
        strongSignalCount={strongSignalsCount}
        onExplorePicks={() => {
          setActiveTab('picks');
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }}
      />

      {/* 3. Fő Tartalom az aktív fül szerint */}
      <main className="flex-1">
        {activeTab === 'grid' && (
          <>
            {/* Kiemelt tippek kompakt ajánló */}
            <TopPicks
              matches={todayMatches}
              onSelectMatch={setSelectedMatch}
              onAddToBetSlip={handleAddToBetSlip}
              betSlipItems={betSlipItems}
            />

            {/* A fő statisztikai rács táblázat */}
            <StatsGrid
              matches={matches}
              dayFilter={dayFilter}
              setDayFilter={setDayFilter}
              onSelectMatch={setSelectedMatch}
              onAddToBetSlip={handleAddToBetSlip}
              betSlipItems={betSlipItems}
            />
          </>
        )}

        {activeTab === 'picks' && (
          <div className="py-6">
            <TopPicks
              matches={todayMatches}
              onSelectMatch={setSelectedMatch}
              onAddToBetSlip={handleAddToBetSlip}
              betSlipItems={betSlipItems}
            />

            {/* További esélyes mérkőzések listája */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              <h3 className="text-xl font-bold text-white mb-4">
                További Magas Várható Értékű (Value) Események
              </h3>
              <StatsGrid
                matches={matches}
                dayFilter="today"
                setDayFilter={setDayFilter}
                onSelectMatch={setSelectedMatch}
                onAddToBetSlip={handleAddToBetSlip}
                betSlipItems={betSlipItems}
              />
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <ResultsView matches={matches} onSelectMatch={setSelectedMatch} />
        )}
      </main>

      {/* 4. Modális komponensek */}
      <MatchDetailModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onAddToBetSlip={handleAddToBetSlip}
        betSlipItems={betSlipItems}
      />

      <BetSlipDrawer
        isOpen={betSlipOpen}
        onClose={() => setBetSlipOpen(false)}
        items={betSlipItems}
        onRemoveItem={handleRemoveBetSlipItem}
        onClearAll={handleClearBetSlip}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaveConfig={handleSaveConfig}
      />

      {/* 5. Prémium Dark Lábléc */}
      <footer className="border-t border-slate-800/80 bg-[#060911] py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <Logo size={32} />
                <span className="font-extrabold text-white text-base tracking-tight">
                  Soccer<span className="text-amber-400">AI</span>
                </span>
                <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  PRO
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-md">
                Kvantitatív labdarúgó analitikai és predikciós platform. 
                Dixon-Coles korrigált Poisson modellezés, Shin de-vigging bukméker árrés szűrés és negyed-Kelly tétméretezés a fegyelmezett, adatvezérelt sportelemzéshez.
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-white uppercase text-[11px] tracking-wider">
                Lefedett Bajnokságok
              </div>
              <ul className="space-y-1 text-slate-400">
                <li>&bull; Premier League &amp; Championship (Anglia)</li>
                <li>&bull; La Liga (Spanyolország)</li>
                <li>&bull; Serie A (Olaszország)</li>
                <li>&bull; Bundesliga (Németország)</li>
                <li>&bull; Ligue 1, Eredivisie &amp; Bajnokok Ligája</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-white uppercase text-[11px] tracking-wider">
                Felelős Játék &amp; Módszertan
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                A rendszer statisztikai valószínűségeket és matematikai várható értékeket (Expected Value) számol. 
                Nem garantál 100%-os biztos nyereményt. Fogadj mindig felelősségteljesen és bankroll-menedzsmenttel! (18+)
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div>
              &copy; 2026 SoccerAI &bull; Minden jog fenntartva.
            </div>
            <div className="flex items-center gap-4">
              <span>Élő Football-Data.org API Integráció</span>
              <span>&bull;</span>
              <span>Poisson &amp; xG Modelling</span>
              <span>&bull;</span>
              <span>Magyar Nyelvű Fejlesztés</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
