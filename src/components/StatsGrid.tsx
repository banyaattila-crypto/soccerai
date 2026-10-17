import React, { useState, useMemo } from 'react';
import { Match, DayFilter, ViewMode, BetSlipItem, FocusMarket } from '../types/football';
import { getProbabilityColorClass } from '../services/predictionEngine';
import {
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Layers,
  Target,
} from 'lucide-react';

interface StatsGridProps {
  matches: Match[];
  dayFilter: DayFilter;
  setDayFilter: (day: DayFilter) => void;
  onSelectMatch: (match: Match) => void;
  onAddToBetSlip: (item: BetSlipItem) => void;
  betSlipItems: BetSlipItem[];
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  matches,
  dayFilter,
  setDayFilter,
  onSelectMatch,
  onAddToBetSlip,
  betSlipItems,
}) => {
  // Alapértelmezett liga: Premier League ('pl') a kompakt kezdőnézethez
  const [selectedLeague, setSelectedLeague] = useState<string>('pl');
  const [viewMode, setViewMode] = useState<ViewMode>('league');
  const [onlyStrongSignals, setOnlyStrongSignals] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusMarket, setFocusMarket] = useState<FocusMarket>('ALL');
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({});

  // Dinamikus dátumkezelés
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const prev = new Date();
    prev.setDate(prev.getDate() - 1);
    const y = prev.getFullYear();
    const m = String(prev.getMonth() + 1).padStart(2, '0');
    const d = String(prev.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    const d = String(next.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const countsByDay = useMemo(() => {
    return {
      yesterday: matches.filter((m) => m.kickoffDate === yesterdayStr).length,
      today: matches.filter((m) => m.kickoffDate === todayStr).length,
      tomorrow: matches.filter((m) => m.kickoffDate === tomorrowStr).length,
    };
  }, [matches, yesterdayStr, todayStr, tomorrowStr]);

  // Meccsek szűrése a nap szerint
  const dayMatches = useMemo(() => {
    let targetDate = todayStr;
    if (dayFilter === 'yesterday') targetDate = yesterdayStr;
    if (dayFilter === 'tomorrow') targetDate = tomorrowStr;

    const filtered = matches.filter((m) => m.kickoffDate === targetDate);
    if (filtered.length > 0) return filtered;
    // Ha ma van kiválasztva, de az API meccsek eltérő dátumúak, mutassuk az összeset
    if (dayFilter === 'today' && matches.length > 0) return matches;
    return [];
  }, [matches, dayFilter, todayStr, yesterdayStr, tomorrowStr]);

  // Dinamikusan kinyert ligák az éppen betöltött meccsekből
  const availableLeagues = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; country: string; flag: string; count: number; priority: number }
    >();

    const pool = dayMatches.length > 0 ? dayMatches : matches;
    pool.forEach((m) => {
      const existing = map.get(m.leagueId);
      if (existing) {
        existing.count += 1;
      } else {
        const priority =
          m.leagueId === 'pl' ? 1 :
          m.leagueId === 'laliga' || m.leagueId === 'pd' ? 2 :
          m.leagueId === 'seriea' || m.leagueId === 'sa' ? 3 :
          m.leagueId === 'bundesliga' || m.leagueId === 'bl1' ? 4 :
          m.leagueId === 'ucl' || m.leagueId === 'cl' ? 5 :
          m.leagueId === 'championship' || m.leagueId === 'elc' ? 6 :
          m.leagueId === 'ligue1' || m.leagueId === 'fl1' ? 7 :
          m.leagueId === 'eredivisie' || m.leagueId === 'ded' ? 8 :
          m.leagueId === 'laliga2' ? 9 :
          m.leagueId === 'serieb' ? 10 :
          m.leagueId === 'bundesliga2' ? 11 :
          m.leagueId === 'ligue2' ? 12 :
          m.leagueId === 'nbi' ? 13 :
          m.leagueId === 'seriea_brazil' || m.leagueId === 'bsa' ? 14 : 20;

        map.set(m.leagueId, {
          id: m.leagueId,
          name: m.leagueName,
          country: m.leagueCountry,
          flag: m.leagueFlag,
          priority,
          count: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.priority - b.priority || b.count - a.count);
  }, [dayMatches, matches]);

  // Ha a kiválasztott liga nem érhető el az adott napon, automatikusan 'all'-ra váltunk
  const effectiveLeague = useMemo(() => {
    if (selectedLeague === 'all') return 'all';
    const exists = availableLeagues.some((l) => l.id === selectedLeague);
    return exists ? selectedLeague : 'all';
  }, [selectedLeague, availableLeagues]);

  // Szűrés a többi kritérium alapján
  const filteredMatches = useMemo(() => {
    return dayMatches.filter((match) => {
      // Liga szűrés
      if (effectiveLeague !== 'all') {
        const matchesExact = match.leagueId === effectiveLeague;
        const matchesAlias =
          (effectiveLeague === 'laliga' && match.leagueId === 'pd') ||
          (effectiveLeague === 'seriea' && match.leagueId === 'sa') ||
          (effectiveLeague === 'bundesliga' && match.leagueId === 'bl1') ||
          (effectiveLeague === 'championship' && match.leagueId === 'elc') ||
          (effectiveLeague === 'ligue1' && match.leagueId === 'fl1') ||
          (effectiveLeague === 'eredivisie' && match.leagueId === 'ded') ||
          (effectiveLeague === 'seriea_brazil' && match.leagueId === 'bsa');
        if (!matchesExact && !matchesAlias) return false;
      }

      // Kereső szűrés (csapatnév vagy liga)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesHome = match.homeTeam.name.toLowerCase().includes(q);
        const matchesAway = match.awayTeam.name.toLowerCase().includes(q);
        const matchesLeague = match.leagueName.toLowerCase().includes(q);
        if (!matchesHome && !matchesAway && !matchesLeague) return false;
      }

      // Csak erős jelek (van benne 60% feletti piac)
      if (onlyStrongSignals) {
        const p = match.probabilities;
        const hasStrong =
          p.homeWin >= 60 ||
          p.awayWin >= 60 ||
          p.bttsYes >= 60 ||
          p.over25 >= 60 ||
          p.over15 >= 75;
        if (!hasStrong) return false;
      }

      return true;
    });
  }, [dayMatches, effectiveLeague, searchQuery, onlyStrongSignals]);

  // Csoportosítás bajnokság szerint ha viewMode === 'league'
  const groupedByLeague = useMemo(() => {
    const groups: { league: { id: string; name: string; country: string; flag: string }; matches: Match[] }[] = [];
    availableLeagues.forEach((league) => {
      const lm = filteredMatches.filter(
        (m) =>
          m.leagueId === league.id ||
          (league.id === 'laliga' && m.leagueId === 'pd') ||
          (league.id === 'seriea' && m.leagueId === 'sa') ||
          (league.id === 'bundesliga' && m.leagueId === 'bl1') ||
          (league.id === 'championship' && m.leagueId === 'elc') ||
          (league.id === 'ligue1' && m.leagueId === 'fl1') ||
          (league.id === 'eredivisie' && m.leagueId === 'ded') ||
          (league.id === 'seriea_brazil' && m.leagueId === 'bsa')
      );
      if (lm.length > 0) {
        groups.push({ league, matches: lm });
      }
    });

    // Ha maradt olyan meccs, ami nem volt az availableLeagues-ben
    const coveredIds = new Set(groups.map((g) => g.league.id));
    filteredMatches.forEach((m) => {
      if (!coveredIds.has(m.leagueId)) {
        groups.push({
          league: {
            id: m.leagueId,
            name: m.leagueName,
            country: m.leagueCountry,
            flag: m.leagueFlag,
          },
          matches: [m],
        });
        coveredIds.add(m.leagueId);
      }
    });

    return groups;
  }, [availableLeagues, filteredMatches]);

  const toggleLeagueCollapse = (leagueId: string) => {
    setCollapsedLeagues((prev) => ({
      ...prev,
      [leagueId]: !prev[leagueId],
    }));
  };

  const allCollapsed = useMemo(() => {
    if (groupedByLeague.length === 0) return false;
    return groupedByLeague.every((g) => collapsedLeagues[g.league.id]);
  }, [groupedByLeague, collapsedLeagues]);

  const handleToggleAllLeagues = () => {
    if (allCollapsed) {
      setCollapsedLeagues({});
    } else {
      const next: Record<string, boolean> = {};
      groupedByLeague.forEach((g) => {
        next[g.league.id] = true;
      });
      setCollapsedLeagues(next);
    }
  };

  // Cellára kattintva közvetlen szelvényhez adás
  const handleCellBet = (
    e: React.MouseEvent,
    match: Match,
    marketLabel: string,
    prob: number,
    odds: number
  ) => {
    e.stopPropagation();
    onAddToBetSlip({
      matchId: match.id,
      matchTitle: `${match.homeTeam.name} - ${match.awayTeam.name}`,
      marketLabel,
      odds,
      probability: prob,
    });
  };

  return (
    <section className="py-6 bg-[#070B14] w-full max-w-full overflow-hidden" id="stats-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Rács Fejléc és Vezérlők */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Statisztikai Esély Rács</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                {filteredMatches.length} mérkőzés
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Válassz bajnokságot a fenti fülekkel, vagy kattints bármelyik mérkőzésre a részletes elemzéshez.
            </p>
          </div>

          {/* Dátumválasztó Tabok (Tegnap / Ma / Holnap) */}
          <div className="flex items-center gap-1 bg-[#0D1527] p-1 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setDayFilter('yesterday')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dayFilter === 'yesterday'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tegnap <span className="opacity-70 text-[10px]">({countsByDay.yesterday})</span>
            </button>
            <button
              onClick={() => setDayFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dayFilter === 'today'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ma <span className="opacity-70 text-[10px]">({countsByDay.today > 0 ? countsByDay.today : matches.length})</span>
            </button>
            <button
              onClick={() => setDayFilter('tomorrow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dayFilter === 'tomorrow'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Holnap <span className="opacity-70 text-[10px]">({countsByDay.tomorrow})</span>
            </button>
          </div>
        </div>

        {/* Szűrők és Keresősáv */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0D1527]/90 border border-slate-800/80 mb-5 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Liga fülek (Alapértelmezett: Premier League!) */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x">
              {availableLeagues.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setSelectedLeague(l.id);
                    setCollapsedLeagues((prev) => ({ ...prev, [l.id]: false }));
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    effectiveLeague === l.id
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.name}</span>
                  <span className="text-[10px] opacity-80 font-mono">({l.count})</span>
                </button>
              ))}
              <button
                onClick={() => setSelectedLeague('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  effectiveLeague === 'all'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                Minden Bajnokság ({dayMatches.length})
              </button>
            </div>

            {/* Kereső */}
            <div className="relative w-full sm:w-60 shrink-0">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Csapat vagy liga keresése..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Másodlagos kapcsolók: Nézet, Erős jelek & Accordion vezérlő */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOnlyStrongSignals(!onlyStrongSignals)}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  onlyStrongSignals
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Csak Kiemelt Jelek (60%+)</span>
              </button>

              <button
                onClick={() => setViewMode(viewMode === 'league' ? 'time' : 'league')}
                className="px-2.5 py-1 rounded-md font-medium bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50 flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{viewMode === 'league' ? 'Nézet: Bajnokság szerint' : 'Nézet: Időrendben'}</span>
              </button>

              {viewMode === 'league' && groupedByLeague.length > 1 && (
                <button
                  onClick={handleToggleAllLeagues}
                  className="px-2.5 py-1 rounded-md font-medium bg-slate-800/80 text-amber-300 hover:text-amber-200 border border-slate-700/50 flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  <span>{allCollapsed ? 'Összes liga kinyitása' : 'Összes liga becsukása'}</span>
                </button>
              )}
            </div>

            {/* 0. Lépés: Fókuszpiac kiválasztása kompakt jobb sávban */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none touch-pan-x">
              <span className="text-[11px] font-bold text-amber-400 whitespace-nowrap flex items-center gap-1 mr-1">
                <Target className="w-3.5 h-3.5" />
                Piac:
              </span>
              {[
                { id: 'ALL', label: 'Mind' },
                { id: 'OVER_25', label: 'O/U 2.5' },
                { id: 'BTTS', label: 'BTTS' },
                { id: '1X2', label: '1X2' },
                { id: 'FH_OVER_05', label: '1.F >0.5' },
                { id: 'OVER_15', label: '>1.5' },
              ].map((mkt) => (
                <button
                  key={mkt.id}
                  onClick={() => setFocusMarket(mkt.id as FocusMarket)}
                  className={`px-2 py-0.5 rounded font-semibold whitespace-nowrap text-[11px] transition-all cursor-pointer ${
                    focusMarket === mkt.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {mkt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= TÁBLÁZAT(OK) ================= */}
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 bg-[#0D1527]/40 rounded-2xl border border-slate-800">
            <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white">Nincs a szűrőknek megfelelő mérkőzés</h3>
            <p className="text-xs text-slate-400 mt-1">
              Próbáld meg kikapcsolni a szűrőket, vagy válaszd a „Minden Bajnokság” fület.
            </p>
            {effectiveLeague !== 'all' && (
              <button
                onClick={() => setSelectedLeague('all')}
                className="mt-3 px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Minden Bajnokság megjelenítése ({dayMatches.length})
              </button>
            )}
          </div>
        ) : viewMode === 'league' ? (
          /* Bajnokságonkénti csoportosítás (Összecsukható Accordion panelekkel!) */
          <div className="space-y-4">
            {groupedByLeague.map(({ league, matches: lMatches }) => {
              const isCollapsed = !!collapsedLeagues[league.id];
              const strongCount = lMatches.filter(
                (m) =>
                  m.probabilities.homeWin >= 60 ||
                  m.probabilities.awayWin >= 60 ||
                  m.probabilities.bttsYes >= 60 ||
                  m.probabilities.over25 >= 60
              ).length;

              return (
                <div
                  key={league.id}
                  className="rounded-2xl bg-[#0D1527] border border-slate-800/90 overflow-hidden shadow-lg"
                >
                  {/* Kattintható Bajnokság Fejléc (Accordion) */}
                  <button
                    type="button"
                    onClick={() => toggleLeagueCollapse(league.id)}
                    className="w-full px-4 sm:px-5 py-3 bg-[#0F182E] hover:bg-[#131E38] border-b border-slate-800/80 flex items-center justify-between transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0">{league.flag}</span>
                      <span className="font-extrabold text-sm text-white tracking-wide truncate">
                        {league.name}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        ({league.country} &bull; {lMatches.length} meccs)
                      </span>
                      {strongCount > 0 && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          <Sparkles className="w-2.5 h-2.5" />
                          {strongCount} erős jel
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                      <span className="text-[11px] hidden sm:inline">
                        {isCollapsed ? 'Kinyitás' : 'Becsukás'}
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Táblázat (csak ha nincs becsukva) */}
                  {!isCollapsed && (
                    <MatchTable
                      matches={lMatches}
                      onSelectMatch={onSelectMatch}
                      onCellBet={handleCellBet}
                      betSlipItems={betSlipItems}
                      focusMarket={focusMarket}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Időrendi lista */
          <div className="rounded-2xl bg-[#0D1527] border border-slate-800/90 overflow-hidden shadow-lg">
            <MatchTable
              matches={filteredMatches.sort((a, b) => a.kickoffTime.localeCompare(b.kickoffTime))}
              onSelectMatch={onSelectMatch}
              onCellBet={handleCellBet}
              betSlipItems={betSlipItems}
              focusMarket={focusMarket}
            />
          </div>
        )}

      </div>
    </section>
  );
};

/* ================= SEGÉDKOMPONENS: TÁBLÁZAT ================= */
interface MatchTableProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onCellBet: (e: React.MouseEvent, match: Match, marketLabel: string, prob: number, odds: number) => void;
  betSlipItems: BetSlipItem[];
  focusMarket: FocusMarket;
}

const MatchTable: React.FC<MatchTableProps> = ({
  matches,
  onSelectMatch,
  onCellBet,
  betSlipItems,
  focusMarket,
}) => {
  return (
    <div
      className="overflow-x-auto touch-pan-x max-w-full"
      style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
    >
      <table className="w-full text-left text-xs whitespace-nowrap min-w-[760px]">
        {/* Fejléc oszlopok */}
        <thead>
          <tr className="border-b border-slate-800 bg-[#0B1222] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
            <th className="py-3 px-3 w-16 text-center">KO / Állapot</th>
            <th className="py-3 px-4 min-w-[200px]">Mérkőzés</th>
            <th className={`py-3 px-2 text-center w-14 ${focusMarket === '1X2' ? 'text-amber-300 bg-amber-500/10 font-black' : ''}`}>1 (Hazai)</th>
            <th className={`py-3 px-2 text-center w-14 ${focusMarket === '1X2' ? 'text-amber-300 bg-amber-500/10 font-black' : ''}`}>X (Dönt.)</th>
            <th className={`py-3 px-2 text-center w-14 ${focusMarket === '1X2' ? 'text-amber-300 bg-amber-500/10 font-black' : ''}`}>2 (Vendég)</th>
            <th className={`py-3 px-2 text-center w-14 ${focusMarket === 'BTTS' ? 'text-amber-300 bg-amber-500/10 font-black' : ''}`}>BTTS (Gól mind2)</th>
            <th className={`py-3 px-2 text-center w-14 ${focusMarket === 'OVER_15' ? 'text-amber-300 bg-amber-500/10 font-black' : ''}`}>&gt; 1.5 Gól</th>
            <th className={`py-3 px-2 text-center w-14 ${focusMarket === 'OVER_25' ? 'text-amber-300 bg-amber-500/10 font-black' : ''}`}>&gt; 2.5 Gól</th>
            <th className="py-3 px-2 text-center w-14">&gt; 3.5 Gól</th>
            <th className={`py-3 px-2 text-center w-14 ${focusMarket === 'FH_OVER_05' ? 'text-amber-300 bg-amber-500/10 font-black' : ''}`}>1.F &gt; 0.5</th>
            <th className="py-3 px-3 text-right w-16">Elemzés</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {matches.map((match) => {
            const p = match.probabilities;
            const cHome = getProbabilityColorClass(p.homeWin);
            const cDraw = getProbabilityColorClass(p.draw);
            const cAway = getProbabilityColorClass(p.awayWin);
            const cBtts = getProbabilityColorClass(p.bttsYes);
            const cO15 = getProbabilityColorClass(p.over15);
            const cO25 = getProbabilityColorClass(p.over25);
            const cO35 = getProbabilityColorClass(p.over35);
            const cFh = getProbabilityColorClass(p.fhOver05);

            const isFinished = match.status === 'FINISHED';

            return (
              <tr
                key={match.id}
                onClick={() => onSelectMatch(match)}
                className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
              >
                {/* 1. KO / Állapot */}
                <td className="py-3 px-3 text-center">
                  {isFinished ? (
                    <span className="inline-flex items-center gap-1 font-bold text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      FT
                    </span>
                  ) : match.status === 'LIVE' ? (
                    <span className="inline-flex items-center gap-1 font-bold text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      ÉLŐ
                    </span>
                  ) : (
                    <span className="font-semibold text-slate-300 text-xs">
                      {match.kickoffTime}
                    </span>
                  )}
                </td>

                {/* 2. Mérkőzés (Csapatok & eredmény) */}
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={match.homeTeam.logo}
                          alt={match.homeTeam.name}
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="font-bold text-white text-xs group-hover:text-amber-200 transition-colors">
                          {match.homeTeam.name}
                        </span>
                      </div>
                      {isFinished && (
                        <span className="font-mono font-bold text-amber-400 text-xs">
                          {match.homeScore}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={match.awayTeam.logo}
                          alt={match.awayTeam.name}
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="font-medium text-slate-300 text-xs group-hover:text-amber-200 transition-colors">
                          {match.awayTeam.name}
                        </span>
                      </div>
                      {isFinished && (
                        <span className="font-mono font-bold text-amber-400 text-xs">
                          {match.awayScore}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* 3. 1 (Hazai Győzelem) */}
                <td
                  onClick={(e) =>
                    onCellBet(e, match, `${match.homeTeam.name} (1)`, p.homeWin, match.odds.home)
                  }
                  className={`py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 ${cHome.bg}`}
                  title={`Hazai siker: ${p.homeWin}% | Odds: ${match.odds.home}`}
                >
                  <div className="font-bold">{p.homeWin}%</div>
                  <div className="text-[9px] opacity-70 font-mono">{match.odds.home.toFixed(2)}</div>
                </td>

                {/* 4. X (Döntetlen) */}
                <td
                  onClick={(e) =>
                    onCellBet(e, match, 'Döntetlen (X)', p.draw, match.odds.draw)
                  }
                  className={`py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 ${cDraw.bg}`}
                  title={`Döntetlen: ${p.draw}% | Odds: ${match.odds.draw}`}
                >
                  <div className="font-bold">{p.draw}%</div>
                  <div className="text-[9px] opacity-70 font-mono">{match.odds.draw.toFixed(2)}</div>
                </td>

                {/* 5. 2 (Vendég Győzelem) */}
                <td
                  onClick={(e) =>
                    onCellBet(e, match, `${match.awayTeam.name} (2)`, p.awayWin, match.odds.away)
                  }
                  className={`py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 ${cAway.bg}`}
                  title={`Vendég siker: ${p.awayWin}% | Odds: ${match.odds.away}`}
                >
                  <div className="font-bold">{p.awayWin}%</div>
                  <div className="text-[9px] opacity-70 font-mono">{match.odds.away.toFixed(2)}</div>
                </td>

                {/* 6. BTTS (Mindkét csapat gól) */}
                <td
                  onClick={(e) =>
                    onCellBet(e, match, 'Mindkét csapat szerez gólt', p.bttsYes, match.odds.bttsYes)
                  }
                  className={`py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 ${cBtts.bg}`}
                  title={`BTTS Igen: ${p.bttsYes}% | Odds: ${match.odds.bttsYes}`}
                >
                  <div className="font-bold">{p.bttsYes}%</div>
                  <div className="text-[9px] opacity-70 font-mono">{match.odds.bttsYes.toFixed(2)}</div>
                </td>

                {/* 7. >1.5 Gól */}
                <td
                  className={`py-2 px-2 text-center rounded-lg ${cO15.bg}`}
                  title={`1.5 gól felett: ${p.over15}%`}
                >
                  <div className="font-bold">{p.over15}%</div>
                </td>

                {/* 8. >2.5 Gól */}
                <td
                  onClick={(e) =>
                    onCellBet(e, match, '2.5 gól felett', p.over25, match.odds.over25)
                  }
                  className={`py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 ${cO25.bg}`}
                  title={`2.5 gól felett: ${p.over25}% | Odds: ${match.odds.over25}`}
                >
                  <div className="font-bold">{p.over25}%</div>
                  <div className="text-[9px] opacity-70 font-mono">{match.odds.over25.toFixed(2)}</div>
                </td>

                {/* 9. >3.5 Gól */}
                <td
                  className={`py-2 px-2 text-center rounded-lg ${cO35.bg}`}
                  title={`3.5 gól felett: ${p.over35}%`}
                >
                  <div className="font-bold">{p.over35}%</div>
                </td>

                {/* 10. 1F >0.5 Gól */}
                <td
                  className={`py-2 px-2 text-center rounded-lg ${cFh.bg}`}
                  title={`1. félidő 0.5 felett: ${p.fhOver05}%`}
                >
                  <div className="font-bold">{p.fhOver05}%</div>
                </td>

                {/* 11. Elemzés gomb */}
                <td className="py-3 px-3 text-right">
                  <span className="p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-amber-500/20 inline-flex items-center transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
