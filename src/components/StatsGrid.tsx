import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Match, DayFilter, ViewMode, BetSlipItem, FocusMarket, PickMarket } from '../types/football';
import { quarterKelly } from '../services/predictionEngine';
import { getRelativeDateStr } from '../utils/dateUtils';
import { useEventBus } from '../utils/eventBus';
import {
  DisplayMode,
  GridMetricId,
  GRID_METRICS,
} from './grid/types';
import { MatchTable } from './grid/MatchTable';
import { MatchCardsList } from './grid/MatchCardsList';
import { MatchCompactList } from './grid/MatchCompactList';
import {
  Search,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Layers,
  Target,
  Table,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Check,
  Star,
} from 'lucide-react';

export * from './grid/types';

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
  const [isLeaguesExpanded, setIsLeaguesExpanded] = useState<boolean>(false);
  const leaguesScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollLeagues = (direction: 'left' | 'right') => {
    if (leaguesScrollRef.current) {
      leaguesScrollRef.current.scrollBy({
        left: direction === 'left' ? -240 : 240,
        behavior: 'smooth',
      });
    }
  };

  // Alapértelmezett nézet: 'compact' (ScoreLab lista), 'cards' vagy 'table'
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soccerai_display_mode');
      if (saved === 'compact' || saved === 'cards' || saved === 'table') {
        return saved;
      }
    }
    return 'compact';
  });

  const handleSetDisplayMode = (mode: DisplayMode) => {
    setDisplayMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('soccerai_display_mode', mode);
    }
  };

  // ScoreLab Dupla Dinamikus Statisztika-választó sáv állapota
  const [metric1, setMetric1] = useState<GridMetricId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soccerai_grid_metric1') as GridMetricId;
      if (GRID_METRICS.some((g) => g.id === saved)) return saved;
    }
    return 'OVER_15';
  });

  const [metric2, setMetric2] = useState<GridMetricId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soccerai_grid_metric2') as GridMetricId;
      if (GRID_METRICS.some((g) => g.id === saved)) return saved;
    }
    return 'BTTS';
  });

  const handleSetMetric1 = (id: GridMetricId) => {
    setMetric1(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('soccerai_grid_metric1', id);
    }
  };

  const handleSetMetric2 = (id: GridMetricId) => {
    setMetric2(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('soccerai_grid_metric2', id);
    }
  };

  const [openMetricDropdown, setOpenMetricDropdown] = useState<1 | 2 | null>(null);

  const metricOption1 = useMemo(
    () => GRID_METRICS.find((g) => g.id === metric1) || GRID_METRICS[0],
    [metric1]
  );
  const metricOption2 = useMemo(
    () => GRID_METRICS.find((g) => g.id === metric2) || GRID_METRICS[4],
    [metric2]
  );

  // Kedvenc mérkőzések (ScoreLab My Matches)
  const [favoriteMatchIds, setFavoriteMatchIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('soccerai_favorite_matches');
        if (saved) return new Set(JSON.parse(saved));
      } catch {
        // Fallback
      }
    }
    return new Set();
  });

  const toggleFavoriteMatch = (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    setFavoriteMatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      try {
        localStorage.setItem('soccerai_favorite_matches', JSON.stringify(Array.from(next)));
      } catch {
        // Fallback
      }
      return next;
    });
  };

  const [onlyStrongSignals, setOnlyStrongSignals] = useState<boolean>(false);
  const [onlyLiveMatches, setOnlyLiveMatches] = useState<boolean>(false);
  const [signalThreshold, setSignalThreshold] = useState<number>(() => {
    if (typeof window === 'undefined') return 60;
    return parseInt(localStorage.getItem('focitipp_threshold') || '60', 10);
  });

  const liveMatchesCount = useMemo(
    () => matches.filter((m) => m.status === 'LIVE').length,
    [matches]
  );

  const handleLiveFilter = useCallback(() => {
    setOnlyLiveMatches(true);
    setDayFilter('today');
    setSelectedLeague('all');
  }, [setDayFilter]);
  useEventBus('filter_live', handleLiveFilter);

  const handleSettingsUpdate = useCallback(() => {
    const val = parseInt(localStorage.getItem('focitipp_threshold') || '60', 10);
    setSignalThreshold(isNaN(val) ? 60 : val);
  }, []);
  useEventBus('settings_updated', handleSettingsUpdate);

  useEffect(() => {
    window.addEventListener('storage', handleSettingsUpdate);
    return () => window.removeEventListener('storage', handleSettingsUpdate);
  }, [handleSettingsUpdate]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusMarket, setFocusMarket] = useState<FocusMarket>('ALL');
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({});

  // Központi helyi időzónás dátumkezelés
  const todayStr = useMemo(() => getRelativeDateStr(0), []);
  const yesterdayStr = useMemo(() => getRelativeDateStr(-1), []);
  const tomorrowStr = useMemo(() => getRelativeDateStr(1), []);

  const countsByDay = useMemo(() => {
    return {
      yesterday: matches.filter((m) => m.kickoffDate === yesterdayStr).length,
      today: matches.filter((m) => m.kickoffDate === todayStr).length,
      tomorrow: matches.filter((m) => m.kickoffDate === tomorrowStr).length,
    };
  }, [matches, yesterdayStr, todayStr, tomorrowStr]);

  // Meccsek szigorú szűrése a kiválasztott nap szerint (nincs más napi átcsorgás)
  const dayMatches = useMemo(() => {
    let targetDate = todayStr;
    if (dayFilter === 'yesterday') targetDate = yesterdayStr;
    if (dayFilter === 'tomorrow') targetDate = tomorrowStr;

    return matches.filter((m) => m.kickoffDate === targetDate);
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
          m.leagueId === 'uel' || m.leagueId === 'el' ? 6 :
          m.leagueId === 'uecl' || m.leagueId === 'ec' ? 7 :
          m.leagueId === 'primeira_liga' || m.leagueId === 'ppl' ? 8 :
          m.leagueId === 'nbi' ? 9 :
          m.leagueId === 'eredivisie' || m.leagueId === 'ded' ? 10 :
          m.leagueId === 'ligue1' || m.leagueId === 'fl1' ? 11 :
          m.leagueId === 'championship' || m.leagueId === 'elc' ? 12 :
          m.leagueId === 'jupiler' ? 13 :
          m.leagueId === 'superlig' ? 14 :
          m.leagueId === 'austria_bundesliga' ? 15 :
          m.leagueId === 'swiss_superleague' ? 16 :
          m.leagueId === 'scot_prem' ? 17 :
          m.leagueId === 'ekstraklasa' ? 18 :
          m.leagueId === 'superleague_greece' ? 19 :
          m.leagueId === 'mls' ? 20 :
          m.leagueId === 'laliga2' ? 21 :
          m.leagueId === 'serieb' ? 22 :
          m.leagueId === 'bundesliga2' ? 23 :
          m.leagueId === 'ligue2' ? 24 :
          m.leagueId === 'seriea_brazil' || m.leagueId === 'bsa' ? 25 : 30;

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
          (effectiveLeague === 'ucl' && match.leagueId === 'cl') ||
          (effectiveLeague === 'uel' && match.leagueId === 'el') ||
          (effectiveLeague === 'uecl' && match.leagueId === 'ec') ||
          (effectiveLeague === 'championship' && match.leagueId === 'elc') ||
          (effectiveLeague === 'ligue1' && match.leagueId === 'fl1') ||
          (effectiveLeague === 'eredivisie' && match.leagueId === 'ded') ||
          (effectiveLeague === 'primeira_liga' && match.leagueId === 'ppl') ||
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

      // Csak erős jelek (a felhasználó által beállított küszöb feletti piac)
      if (onlyStrongSignals) {
        const p = match.probabilities;
        const hasStrong =
          p.homeWin >= signalThreshold ||
          p.awayWin >= signalThreshold ||
          p.bttsYes >= signalThreshold ||
          p.over25 >= signalThreshold ||
          p.over15 >= Math.min(95, signalThreshold + 15);
        if (!hasStrong) return false;
      }

      // Csak élő mérkőzések
      if (onlyLiveMatches && match.status !== 'LIVE') {
        return false;
      }

      return true;
    });
  }, [dayMatches, effectiveLeague, searchQuery, onlyStrongSignals, signalThreshold, onlyLiveMatches]);

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
        const sortedLm = [...lm].sort((a, b) => a.kickoffTime.localeCompare(b.kickoffTime));
        groups.push({ league, matches: sortedLm });
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

  // Időrendbe rendezett meccsek a kronologikus nézethez (garantáltan új tömböt ad, soha nem mutálja a filteredMatches-t)
  const sortedFilteredMatches = useMemo(() => {
    return [...filteredMatches].sort((a, b) => a.kickoffTime.localeCompare(b.kickoffTime));
  }, [filteredMatches]);

  // Kedvenc meccsek kiszűrése az adott napra (időrendi sorrendben)
  const favoriteMatches = useMemo(() => {
    if (favoriteMatchIds.size === 0) return [];
    return dayMatches
      .filter((m) => favoriteMatchIds.has(m.id))
      .sort((a, b) => a.kickoffTime.localeCompare(b.kickoffTime));
  }, [dayMatches, favoriteMatchIds]);

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
    odds: number,
    market?: PickMarket
  ) => {
    e.stopPropagation();
    const isSim = match.aiPick?.isSimulatedOdds !== false;
    const isExp = match.aiPick?.isOddsExpired ?? false;

    // A kattintott piacnak megfelelő bukméker kikeresése
    let bookie = match.aiPick?.bookmakerName || match.realOdds?.bestOdds.home?.bookmaker;
    if (match.realOdds?.bestOdds) {
      if (market === '1' && match.realOdds.bestOdds.home?.bookmaker) {
        bookie = match.realOdds.bestOdds.home.bookmaker;
      } else if (market === 'X' && match.realOdds.bestOdds.draw?.bookmaker) {
        bookie = match.realOdds.bestOdds.draw.bookmaker;
      } else if (market === '2' && match.realOdds.bestOdds.away?.bookmaker) {
        bookie = match.realOdds.bestOdds.away.bookmaker;
      } else if (market === 'OVER_25' && match.realOdds.bestOdds.over25?.bookmaker) {
        bookie = match.realOdds.bestOdds.over25.bookmaker;
      } else if (market === 'BTTS_YES' && match.realOdds.bestOdds.bttsYes?.bookmaker) {
        bookie = match.realOdds.bestOdds.bttsYes.bookmaker;
      }
    }

    // A kattintott cella saját esélyéből és oddsából számoljuk a Kelly-százalékot,
    // megakadályozva, hogy egy másik (akár ellentétes vagy negatív EV-s) piac értéke kerüljön át.
    let cellKelly = 0;
    if (!isSim && !isExp && odds > 1.0 && prob > 0) {
      if (market && match.aiPick?.market === market && typeof match.aiPick.quarterKellyPct === 'number') {
        cellKelly = match.aiPick.quarterKellyPct;
      } else {
        cellKelly = quarterKelly(prob, odds);
      }
    }

    onAddToBetSlip({
      matchId: match.id,
      matchTitle: `${match.homeTeam.name} - ${match.awayTeam.name}`,
      marketLabel,
      market,
      odds,
      probability: prob,
      quarterKellyPct: cellKelly,
      isRealOdds: !isSim && !isExp,
      isSimulatedOdds: isSim,
      bookmakerName: !isSim ? bookie : undefined,
      oddsExpiresAt: match.aiPick?.oddsExpiresAt,
      isExpired: isExp,
      matchStatus: match.status,
      kickoffDate: match.kickoffDate,
      kickoffTime: match.kickoffTime,
    });
  };

  return (
    <section className="py-6 bg-transparent w-full max-w-full overflow-hidden" id="stats-grid">
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
          <div className="flex items-center gap-1 bg-mesh-dark p-1 rounded-xl border border-slate-800 self-start md:self-auto">
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
        <div className="p-3.5 sm:p-4 rounded-2xl bg-mesh-card border border-slate-800/80 mb-5 space-y-3.5">
          {/* Felső sor: Kereső és gyors infó */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Bajnokságok ({availableLeagues.length})</span>
              </span>
              <button
                onClick={() => setIsLeaguesExpanded(!isLeaguesExpanded)}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title={isLeaguesExpanded ? 'Egy soros görgethető nézet' : 'Összes liga kibontása több sorba'}
              >
                {isLeaguesExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 text-emerald-400" />
                    <span>Összecsukás (1 sor)</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 text-emerald-400" />
                    <span>Összes liga kibontása ({availableLeagues.length})</span>
                  </>
                )}
              </button>
            </div>

            {/* Kereső */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Csapat vagy liga keresése..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Második sor: Teljes szélességű Liga választó görgetőgombokkal */}
          <div className="relative w-full">
            {!isLeaguesExpanded && (
              <>
                <button
                  onClick={() => scrollLeagues('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg bg-slate-900/95 text-slate-300 hover:text-white border border-slate-700 shadow-lg cursor-pointer hidden md:flex items-center justify-center"
                  title="Görgetés balra"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollLeagues('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg bg-slate-900/95 text-slate-300 hover:text-white border border-slate-700 shadow-lg cursor-pointer hidden md:flex items-center justify-center"
                  title="Görgetés jobbra"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            <div
              ref={leaguesScrollRef}
              className={`w-full py-1 ${
                isLeaguesExpanded
                  ? 'flex flex-wrap gap-1.5'
                  : 'flex items-center gap-1.5 overflow-x-auto scroll-smooth md:px-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent touch-pan-x'
              }`}
            >
              {availableLeagues.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setSelectedLeague(l.id);
                    setCollapsedLeagues((prev) => ({ ...prev, [l.id]: false }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    effectiveLeague === l.id
                      ? 'bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-600/30 border border-emerald-500/50'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                      effectiveLeague === l.id ? 'bg-black/30 text-emerald-200' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {l.count}
                  </span>
                </button>
              ))}

              <button
                onClick={() => setSelectedLeague('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  effectiveLeague === 'all'
                    ? 'bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-600/30 border border-emerald-500/50'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                Minden Bajnokság ({dayMatches.length})
              </button>
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
                <span>Csak Kiemelt Jelek ({signalThreshold}%+)</span>
              </button>

              {/* Élő mérkőzések gyorsszűrő gomb */}
              <button
                type="button"
                onClick={() => setOnlyLiveMatches(!onlyLiveMatches)}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  onlyLiveMatches
                    ? 'bg-red-500/25 text-red-200 border border-red-500/60 shadow-sm'
                    : liveMatchesCount > 0
                    ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
                title="Csak az éppen folyamatban lévő mérkőzések szűrése"
              >
                <span className="relative flex h-2 w-2">
                  {liveMatchesCount > 0 && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      liveMatchesCount > 0 ? 'bg-red-500' : 'bg-slate-500'
                    }`}
                  ></span>
                </span>
                <span>Csak Élő ({liveMatchesCount})</span>
              </button>

              <button
                onClick={() => setViewMode(viewMode === 'league' ? 'time' : 'league')}
                className="px-2.5 py-1 rounded-md font-medium bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50 flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{viewMode === 'league' ? 'Bajnokság szerint' : 'Időrendben'}</span>
              </button>

              {/* Nézetváltó: Kompakt vs Kártyák vs Táblázat */}
              <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => handleSetDisplayMode('compact')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    displayMode === 'compact' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="ScoreLab kompakt meccssoros nézet"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Kompakt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDisplayMode('cards')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    displayMode === 'cards' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Kártyás nézet"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kártyák</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDisplayMode('table')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    displayMode === 'table' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Részletes táblázat nézet"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Táblázat</span>
                </button>
              </div>

              {viewMode === 'league' && groupedByLeague.length > 1 && (
                <button
                  onClick={handleToggleAllLeagues}
                  className="px-2.5 py-1 rounded-md font-medium bg-slate-800/80 text-amber-300 hover:text-amber-200 border border-slate-700/50 flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  <span>{allCollapsed ? 'Összes kinyitása' : 'Összes becsukása'}</span>
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

        {/* ================= SCORELAB DUPLA DINAMIKUS STATISZTIKA-VÁLASZTÓ SÁV ================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5 p-3.5 rounded-2xl bg-mesh-card border border-slate-800/90 shadow-md">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Dinamikus Kvantitatív Mutatósáv</span>
                <span className="text-[10px] font-mono font-normal text-slate-400 hidden md:inline">
                  &bull; Meccssorokon megjelenített 2 mutató
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap relative">
            {openMetricDropdown && (
              <div
                className="fixed inset-0 z-20 cursor-default"
                onClick={() => setOpenMetricDropdown(null)}
              />
            )}

            {/* 1. Mutató választó gomb & dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => setOpenMetricDropdown(openMetricDropdown === 1 ? null : 1)}
                className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border transition-all cursor-pointer z-30 relative ${
                  openMetricDropdown === 1
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-200 hover:text-white border-slate-700 hover:border-slate-600'
                }`}
                title="1. statisztikai mutató megváltoztatása"
              >
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] flex items-center justify-center font-black shrink-0">
                  1.
                </span>
                <span className="font-mono">{metricOption1.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform shrink-0 ${
                    openMetricDropdown === 1 ? 'rotate-180 text-cyan-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {openMetricDropdown === 1 && (
                <div className="absolute left-0 top-full mt-1.5 w-60 p-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-30 space-y-0.5 max-h-72 overflow-y-auto">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    1. Mutató kiválasztása
                  </div>
                  {GRID_METRICS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        handleSetMetric1(opt.id);
                        setOpenMetricDropdown(null);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer ${
                        metric1 === opt.id
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {metric1 === opt.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Mutató választó gomb & dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => setOpenMetricDropdown(openMetricDropdown === 2 ? null : 2)}
                className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border transition-all cursor-pointer z-30 relative ${
                  openMetricDropdown === 2
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400 shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-900 text-slate-200 hover:text-white border-slate-700 hover:border-slate-600'
                }`}
                title="2. statisztikai mutató megváltoztatása"
              >
                <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] flex items-center justify-center font-black shrink-0">
                  2.
                </span>
                <span className="font-mono">{metricOption2.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform shrink-0 ${
                    openMetricDropdown === 2 ? 'rotate-180 text-indigo-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {openMetricDropdown === 2 && (
                <div className="absolute right-0 top-full mt-1.5 w-60 p-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-30 space-y-0.5 max-h-72 overflow-y-auto">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    2. Mutató kiválasztása
                  </div>
                  {GRID_METRICS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        handleSetMetric2(opt.id);
                        setOpenMetricDropdown(null);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer ${
                        metric2 === opt.id
                          ? 'bg-indigo-500/20 text-indigo-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {metric2 === opt.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= TÁBLÁZAT(OK) ================= */}
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 bg-mesh-card rounded-2xl border border-slate-800">
            <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white">Nincs a szűrőknek megfelelő mérkőzés</h3>
            <p className="text-xs text-slate-400 mt-1">
              Próbáld meg kikapcsolni a szűrőket, vagy válaszd a „Minden Bajnokság” fület.
            </p>
            {onlyLiveMatches && (
              <button
                type="button"
                onClick={() => setOnlyLiveMatches(false)}
                className="mt-3 mr-2 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Élő szűrő kikapcsolása (Összes meccs)
              </button>
            )}
            {effectiveLeague !== 'all' && (
              <button
                onClick={() => setSelectedLeague('all')}
                className="mt-3 px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Minden Bajnokság megjelenítése ({dayMatches.length})
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* ⭐ KEDVENC MÉRKŐZÉSEK (ScoreLab My Matches blokk) */}
            {favoriteMatches.length > 0 && (
              <div className="rounded-2xl bg-mesh-card border border-amber-500/30 overflow-hidden shadow-lg shadow-amber-500/5">
                <div className="w-full px-4 sm:px-5 py-3 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-b border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-extrabold text-sm text-white tracking-wide">
                      Kedvenc Mérkőzések (My Matches)
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      {favoriteMatches.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Kitűzve a lista tetejére
                  </span>
                </div>

                {displayMode === 'compact' ? (
                  <MatchCompactList
                    matches={favoriteMatches}
                    onSelectMatch={onSelectMatch}
                    onCellBet={handleCellBet}
                    betSlipItems={betSlipItems}
                    metric1={metricOption1}
                    metric2={metricOption2}
                    favoriteMatchIds={favoriteMatchIds}
                    onToggleFavorite={toggleFavoriteMatch}
                  />
                ) : displayMode === 'cards' ? (
                  <MatchCardsList
                    matches={favoriteMatches}
                    onSelectMatch={onSelectMatch}
                    onCellBet={handleCellBet}
                    betSlipItems={betSlipItems}
                    focusMarket={focusMarket}
                    favoriteMatchIds={favoriteMatchIds}
                    onToggleFavorite={toggleFavoriteMatch}
                  />
                ) : (
                  <MatchTable
                    matches={favoriteMatches}
                    onSelectMatch={onSelectMatch}
                    onCellBet={handleCellBet}
                    betSlipItems={betSlipItems}
                    focusMarket={focusMarket}
                  />
                )}
              </div>
            )}

            {viewMode === 'league' ? (
              /* Bajnokságonkénti csoportosítás (Összecsukható Accordion panelekkel!) */
              <div className="space-y-4">
                {groupedByLeague.map(({ league, matches: lMatches }) => {
                  const isCollapsed = !!collapsedLeagues[league.id];
                  const strongCount = lMatches.filter(
                    (m) =>
                      m.probabilities.homeWin >= signalThreshold ||
                      m.probabilities.awayWin >= signalThreshold ||
                      m.probabilities.bttsYes >= signalThreshold ||
                      m.probabilities.over25 >= signalThreshold
                  ).length;

                  return (
                    <div
                      key={league.id}
                      className="rounded-2xl bg-mesh-card border border-slate-800/90 overflow-hidden shadow-lg"
                    >
                      {/* Kattintható Bajnokság Fejléc (Accordion) */}
                      <button
                        type="button"
                        onClick={() => toggleLeagueCollapse(league.id)}
                        className="w-full px-4 sm:px-5 py-3 bg-mesh-header hover:bg-[#131E38] border-b border-slate-800/80 flex items-center justify-between transition-colors cursor-pointer text-left"
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

                      {/* Kompakt, Kártyák vagy Táblázat (csak ha nincs becsukva) */}
                      {!isCollapsed && (
                        displayMode === 'compact' ? (
                          <MatchCompactList
                            matches={lMatches}
                            onSelectMatch={onSelectMatch}
                            onCellBet={handleCellBet}
                            betSlipItems={betSlipItems}
                            metric1={metricOption1}
                            metric2={metricOption2}
                            favoriteMatchIds={favoriteMatchIds}
                            onToggleFavorite={toggleFavoriteMatch}
                          />
                        ) : displayMode === 'cards' ? (
                          <MatchCardsList
                            matches={lMatches}
                            onSelectMatch={onSelectMatch}
                            onCellBet={handleCellBet}
                            betSlipItems={betSlipItems}
                            focusMarket={focusMarket}
                            favoriteMatchIds={favoriteMatchIds}
                            onToggleFavorite={toggleFavoriteMatch}
                          />
                        ) : (
                          <MatchTable
                            matches={lMatches}
                            onSelectMatch={onSelectMatch}
                            onCellBet={handleCellBet}
                            betSlipItems={betSlipItems}
                            focusMarket={focusMarket}
                          />
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Időrendi lista */
              <div className="rounded-2xl bg-mesh-card border border-slate-800/90 overflow-hidden shadow-lg">
                {displayMode === 'compact' ? (
                  <MatchCompactList
                    matches={sortedFilteredMatches}
                    onSelectMatch={onSelectMatch}
                    onCellBet={handleCellBet}
                    betSlipItems={betSlipItems}
                    metric1={metricOption1}
                    metric2={metricOption2}
                    favoriteMatchIds={favoriteMatchIds}
                    onToggleFavorite={toggleFavoriteMatch}
                  />
                ) : displayMode === 'cards' ? (
                  <MatchCardsList
                    matches={sortedFilteredMatches}
                    onSelectMatch={onSelectMatch}
                    onCellBet={handleCellBet}
                    betSlipItems={betSlipItems}
                    focusMarket={focusMarket}
                    favoriteMatchIds={favoriteMatchIds}
                    onToggleFavorite={toggleFavoriteMatch}
                  />
                ) : (
                  <MatchTable
                    matches={sortedFilteredMatches}
                    onSelectMatch={onSelectMatch}
                    onCellBet={handleCellBet}
                    betSlipItems={betSlipItems}
                    focusMarket={focusMarket}
                  />
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};

