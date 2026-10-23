import React, { useState, useMemo } from 'react';
import { Match, BetSlipItem } from '../types/football';
import {
  extractOpportunitiesFromMatches,
  filterAndSortOpportunities,
  computeLeagueRadarStats,
  ScannerPreset,
  ScannerSortBy,
} from '../services/scannerService';
import { getRelativeDateStr } from '../utils/dateUtils';
import { OpportunityCard } from './scanner/OpportunityCard';
import { LeagueRadar } from './scanner/LeagueRadar';
import {
  Radar,
  Zap,
  TrendingUp,
  Flame,
  Search,
  Filter,
  ArrowUpDown,
  ShieldAlert,
  Layers,
  Sparkles,
  Trophy,
  Calendar,
  Clock,
} from 'lucide-react';

interface ScannerViewProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onAddToBetSlip: (item: BetSlipItem) => void;
  betSlipItems: BetSlipItem[];
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  matches,
  onSelectMatch,
  onAddToBetSlip,
  betSlipItems,
}) => {
  // Összes lehetőség kinyerése
  const allOpportunities = useMemo(() => {
    return extractOpportunitiesFromMatches(matches);
  }, [matches]);

  // KPI mutatók
  const positiveEvCount = useMemo(() => {
    return allOpportunities.filter((o) => o.expectedValue > 0).length;
  }, [allOpportunities]);

  const highOverCount = useMemo(() => {
    return allOpportunities.filter((o) => o.market === 'OVER_25' && o.probability >= 65).length;
  }, [allOpportunities]);

  // Ellenőrizzük, hogy vannak-e még nyitott meccsek ma
  const hasOpenMatchesToday = useMemo(() => {
    const today = getRelativeDateStr(0);
    return matches.some((m) => m.kickoffDate === today && m.status !== 'FINISHED');
  }, [matches]);

  // Állapotok: Intelligens alapértelmezés (ha nincsenek valós +EV oddsok, azonnal a Kiemelt MI Tippek jelennek meg)
  const [activePreset, setActivePreset] = useState<ScannerPreset>(() => {
    return positiveEvCount > 0 ? 'best_ev' : 'ai_picks';
  });
  const [activeSubTab, setActiveSubTab] = useState<'opportunities' | 'league_radar'>('opportunities');
  const [dayFilter, setDayFilter] = useState<'today' | 'tomorrow' | 'all' | 'yesterday'>(() => {
    return hasOpenMatchesToday ? 'today' : 'all';
  });
  const [statusFilter, setStatusFilter] = useState<'open_only' | 'all' | 'finished'>('open_only');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [minProb, setMinProb] = useState<number>(50);
  const [minOdds, setMinOdds] = useState<number>(1.40);
  const [onlyRealOdds, setOnlyRealOdds] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<ScannerSortBy>('ev');

  // Szűrt és rendezett lehetőségek
  const filteredOpportunities = useMemo(() => {
    return filterAndSortOpportunities(allOpportunities, {
      preset: activePreset,
      minProb,
      minOdds,
      leagueId: selectedLeague,
      dayFilter,
      statusFilter,
      onlyRealOdds,
      searchQuery,
      sortBy,
    });
  }, [allOpportunities, activePreset, minProb, minOdds, selectedLeague, dayFilter, statusFilter, onlyRealOdds, searchQuery, sortBy]);

  // Ligák radar statisztikái
  const leagueRadarStats = useMemo(() => {
    return computeLeagueRadarStats(matches);
  }, [matches]);

  // Elérhető ligák a szűrőhöz
  const distinctLeagues = useMemo(() => {
    const map = new Map<string, { id: string; name: string; flag: string }>();
    matches.forEach((m) => {
      if (!map.has(m.leagueId)) {
        map.set(m.leagueId, { id: m.leagueId, name: m.leagueName, flag: m.leagueFlag });
      }
    });
    return Array.from(map.values());
  }, [matches]);

  const presets: { id: ScannerPreset; label: string; icon: React.ReactNode }[] = [
    { id: 'best_ev', label: '💎 +EV Értéktippek', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'value_sweetspot', label: '🎯 Érték Sáv (1.55 - 2.45)', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'ai_picks', label: '🎯 Kiemelt MI Tippek', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'over_25', label: '⚽ Over 2.5 Gólradar', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'btts', label: '🥅 Mindkét Csapat Lő', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'favorites', label: '🛡️ Játszható Favoritok (1.45+)', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'half_time', label: '⚡ 1.F > 0.5 Gól', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'underdogs', label: '💣 Értékes Meglepetések', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { id: 'all', label: 'Összes Lehetőség', icon: <Filter className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-200 animate-fade-in">
      
      {/* 1. Fejléc & Kvantitatív KPI Sáv */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-mesh-card border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Radar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Kvantitatív Értékkereső &bull; Scanner
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 font-mono">
                  ÉLŐ RADAR
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Piacok és kimenetelek szűrése várható érték (+EV), valószínűség és Dixon-Coles Poisson eloszlás szerint
              </p>
            </div>
          </div>
        </div>

        {/* Gyors KPI Blokkok */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Pozitív Élek (+EV)</span>
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
              {positiveEvCount} db
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Over 2.5 (65%+)</span>
            <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
              {highOverCount} db
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Lefedett Meccs</span>
            <span className="text-base sm:text-lg font-black text-teal-400 font-mono">
              {matches.length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Nézetváltó fül: Kereső Lista vs Liga Statisztikai Radar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('opportunities')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'opportunities'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Piacok &amp; Értéktippek ({filteredOpportunities.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('league_radar')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'league_radar'
                ? 'bg-blue-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Bajnokság Radar ({leagueRadarStats.length} liga)</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'opportunities' ? (
        <div className="space-y-4">
          
          {/* Időszak & Státusz Választó Sáv */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <button
                onClick={() => {
                  setDayFilter('today');
                  setStatusFilter('open_only');
                }}
                className={`py-1.5 px-3 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  dayFilter === 'today' && statusFilter === 'open_only'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Mai Értéktippek</span>
              </button>
              <button
                onClick={() => {
                  setDayFilter('tomorrow');
                  setStatusFilter('open_only');
                }}
                className={`py-1.5 px-3 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  dayFilter === 'tomorrow' && statusFilter === 'open_only'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Holnapi Meccsek</span>
              </button>
              <button
                onClick={() => {
                  setDayFilter('all');
                  setStatusFilter('open_only');
                }}
                className={`py-1.5 px-3 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  dayFilter === 'all' && statusFilter === 'open_only'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Összes Nyitott Meccs</span>
              </button>
              <button
                onClick={() => {
                  setDayFilter('all');
                  setStatusFilter('finished');
                }}
                className={`py-1.5 px-3 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  statusFilter === 'finished'
                    ? 'bg-slate-700 text-white border-slate-600 shadow-md font-black'
                    : 'bg-slate-950/70 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Lezárt / Archív EV</span>
              </button>
            </div>
            <div className="text-[11px] text-slate-400 font-mono shrink-0">
              Találatok: <span className="font-bold text-brand-400">{filteredOpportunities.length}</span> db lehetőség
            </div>
          </div>

          {/* Preset Választó Kapszulák */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePreset(p.id)}
                className={`py-2 px-3 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  activePreset === p.id
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 shadow-md shadow-brand-950/40'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.icon}
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Szűrő és Rendezősáv */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs">
            {/* Keresés */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Csapat vagy liga keresése..."
                className="w-full bg-slate-950/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Bajnokság kiválasztó */}
            <div>
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
              >
                <option value="ALL">Minden Bajnokság ({distinctLeagues.length})</option>
                {distinctLeagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Min. Szorzó Szűrő */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">Min. Odds:</span>
              <select
                value={minOdds}
                onChange={(e) => setMinOdds(Number(e.target.value))}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60 font-semibold"
              >
                <option value={1.01}>Minden odds (1.01+)</option>
                <option value={1.40}>Játszható odds (1.40+)</option>
                <option value={1.55}>🎯 Érték Sáv (1.55+)</option>
                <option value={1.75}>🔥 Magas Érték (1.75+)</option>
                <option value={2.00}>💎 Duplázó (2.00+)</option>
              </select>
            </div>

            {/* Min. Valószínűség */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">Min. Esély:</span>
              <div className="flex items-center gap-1 flex-1">
                {[0, 50, 60, 70].map((val) => (
                  <button
                    key={val}
                    onClick={() => setMinProb(val)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold border ${
                      minProb === val
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {val === 0 ? 'Mind' : `${val}%+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Rendezés */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ScannerSortBy)}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
              >
                <option value="ev">Rendezés: Várható Érték (+EV %)</option>
                <option value="prob">Rendezés: Valószínűség (%)</option>
                <option value="odds">Rendezés: Bukmékeri Odds</option>
                <option value="kelly">Rendezés: Negyed-Kelly Tét (%)</option>
                <option value="time">Rendezés: Kezdési Időpont</option>
              </select>
            </div>

            {/* Valós bukméker odds szűrő toggle */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setOnlyRealOdds((prev) => !prev)}
                className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  onlyRealOdds
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Csak a Pinnacle és Bet365 valós, érvényes oddsaival rendelkező meccsek"
              >
                <span>🏢 Csak Valós Oddsok</span>
                {onlyRealOdds && <span className="text-[9px] bg-blue-800 px-1 py-0.2 rounded">AKTÍV</span>}
              </button>
            </div>
          </div>

          {/* Találati Kártyák */}
          {filteredOpportunities.length > 0 ? (
            <div className="space-y-2.5">
              {filteredOpportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opp={opp}
                  isAdded={betSlipItems.some((item) => item.matchId === opp.match.id && item.marketLabel === opp.marketLabel)}
                  onSelectMatch={onSelectMatch}
                  onAddToBetSlip={onAddToBetSlip}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
              <Radar className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-300">
                Nem található a szűrésnek megfelelő fogadási lehetőség
              </div>
              {activePreset === 'best_ev' && positiveEvCount === 0 ? (
                <div className="max-w-md mx-auto space-y-3 text-xs text-slate-400">
                  <p className="leading-relaxed">
                    A <strong className="text-amber-400">💎 +EV (értéktipp)</strong> kereső valós, élő bukmékeri szorzókat (API-Sports) igényel. Jelenleg a modell szimulált szorzói aktívak, amelyekre nem képzünk mesterséges piaci arbitrázst.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-1">
                    <button
                      onClick={() => setActivePreset('ai_picks')}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer text-xs"
                    >
                      🎯 Váltás a Kiemelt MI Tippekre
                    </button>
                    <button
                      onClick={() => {
                        setActivePreset('all');
                        setDayFilter('all');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-colors cursor-pointer text-xs"
                    >
                      📋 Összes Meccs Megtekintése
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {dayFilter === 'today'
                      ? 'A mai napra jelenleg nincs aktív meccs a kiválasztott szűrőkkel.'
                      : 'Próbáld meg csökkenteni a minimum esély küszöböt, vagy válts az „Összes Lehetőség” presetre.'}
                  </p>
                  {dayFilter !== 'all' && (
                    <button
                      onClick={() => {
                        setDayFilter('all');
                        setStatusFilter('open_only');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Összes Nyitott Meccs Mutatása
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        /* Liga Statisztikai Radar Nézet */
        <LeagueRadar stats={leagueRadarStats} />
      )}

    </div>
  );
};
