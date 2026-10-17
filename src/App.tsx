import React, { useState, useMemo } from 'react';
import { Match, DayFilter, BetSlipItem } from './types/football';
import { MOCK_MATCHES, LEAGUES } from './data/mockMatches';
import { Header } from './components/Header';
import { HeroKpi } from './components/HeroKpi';
import { TopPicks } from './components/TopPicks';
import { StatsGrid } from './components/StatsGrid';
import { MatchDetailModal } from './components/MatchDetailModal';
import { BetSlipDrawer } from './components/BetSlipDrawer';
import { SettingsModal } from './components/SettingsModal';
import { ResultsView } from './components/ResultsView';
import { Sparkles, Shield, Cpu, RefreshCw } from 'lucide-react';

export function App() {
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [activeTab, setActiveTab] = useState<'grid' | 'picks' | 'results'>('grid');
  const [dayFilter, setDayFilter] = useState<DayFilter>('today');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [betSlipOpen, setBetSlipOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [betSlipItems, setBetSlipItems] = useState<BetSlipItem[]>([]);

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
  const todayMatches = useMemo(() => {
    return matches.filter((m) => m.kickoffDate === '2026-10-17');
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
      />

      {/* 2. Hero Szekció KPI Mutatókkal & Jelmagyarázattal */}
      <HeroKpi
        matchCount={todayMatches.length}
        leagueCount={LEAGUES.length}
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
      />

      {/* 5. Prémium Dark Lábléc */}
      <footer className="border-t border-slate-800/80 bg-[#060911] py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <span className="font-extrabold text-white text-base tracking-tight">
                  TippMester<span className="text-amber-400">.ai</span>
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-md">
                Magyar nyelvű kompakt labdarúgó analitikai platform, a footballtipster.ai bevált hőtérképes mintájára kifejlesztve. 
                Matematikai Poisson modellezés és xG alapú valószínűségszámítás a fegyelmezett sportfogadáshoz.
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-white uppercase text-[11px] tracking-wider">
                Lefedett Bajnokságok
              </div>
              <ul className="space-y-1 text-slate-400">
                <li>&bull; Premier League (Anglia)</li>
                <li>&bull; La Liga (Spanyolország)</li>
                <li>&bull; Serie A (Olaszország)</li>
                <li>&bull; Bundesliga (Németország)</li>
                <li>&bull; OTP Bank Liga (Magyarország)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-white uppercase text-[11px] tracking-wider">
                Felelős Játék & Módszertan
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                A rendszer statisztikai valószínűségeket és matematikai várható értékeket (Expected Value) számol. 
                Nem garantál 100%-os biztos nyereményt. Fogadj mindig felelősségteljesen és bankroll-menedzsmenttel! (18+)
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div>
              &copy; 2026 TippMester.ai &bull; Minden jog fenntartva.
            </div>
            <div className="flex items-center gap-4">
              <span>Algoritmikus Sportanalitika</span>
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
