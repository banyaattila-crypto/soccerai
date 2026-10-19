import React, { useState, useMemo, useEffect } from 'react';
import { Match, DayFilter, ViewMode, BetSlipItem, FocusMarket, PickMarket } from '../types/football';
import { getProbabilityColorClass } from '../services/predictionEngine';
import { getRelativeDateStr } from '../utils/dateUtils';
import {
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Layers,
  Target,
  Table,
  LayoutGrid,
  Calendar,
  Clock,
  List,
  SlidersHorizontal,
  Check,
  Star,
} from 'lucide-react';

export type DisplayMode = 'compact' | 'cards' | 'table';

export type GridMetricId =
  | 'OVER_15'
  | 'OVER_25'
  | 'UNDER_25'
  | 'OVER_35'
  | 'BTTS'
  | 'HOME_WIN'
  | 'DRAW'
  | 'AWAY_WIN'
  | 'FH_OVER_05'
  | 'BTTS_AND_OVER25';

export interface GridMetricOption {
  id: GridMetricId;
  label: string;
  shortLabel: string;
  marketName: (match: Match) => string;
  market: PickMarket;
  getValue: (p: Match['probabilities']) => number;
  getOdds: (match: Match) => number;
}

export const GRID_METRICS: GridMetricOption[] = [
  {
    id: 'OVER_15',
    label: 'Over 1.5 %',
    shortLabel: 'Goal >1.5',
    marketName: () => '1.5 gól felett',
    market: 'OVER_15',
    getValue: (p) => p.over15,
    getOdds: (m) => Number(Math.max(1.05, +(100 / Math.max(10, m.probabilities.over15 * 0.94)).toFixed(2))),
  },
  {
    id: 'OVER_25',
    label: 'Over 2.5 %',
    shortLabel: 'Goal >2.5',
    marketName: () => '2.5 gól felett',
    market: 'OVER_25',
    getValue: (p) => p.over25,
    getOdds: (m) => m.odds.over25,
  },
  {
    id: 'UNDER_25',
    label: 'Under 2.5 %',
    shortLabel: 'Goal <2.5',
    marketName: () => '2.5 gól alatt',
    market: 'UNDER_25',
    getValue: (p) => Math.max(1, 100 - p.over25),
    getOdds: (m) => Number(Math.max(1.10, +(100 / Math.max(10, (100 - m.probabilities.over25) * 0.94)).toFixed(2))),
  },
  {
    id: 'OVER_35',
    label: 'Over 3.5 %',
    shortLabel: 'Goal >3.5',
    marketName: () => '3.5 gól felett',
    market: 'OVER_35',
    getValue: (p) => p.over35,
    getOdds: (m) => Number(Math.max(1.20, +(100 / Math.max(10, m.probabilities.over35 * 0.94)).toFixed(2))),
  },
  {
    id: 'BTTS',
    label: 'BTTS %',
    shortLabel: 'BTTS',
    marketName: () => 'Mindkét csapat szerez gólt (BTTS)',
    market: 'BTTS_YES',
    getValue: (p) => p.bttsYes,
    getOdds: (m) => m.odds.bttsYes,
  },
  {
    id: 'HOME_WIN',
    label: '1 (Hazai) %',
    shortLabel: '1 (Hazai)',
    marketName: (m) => `${m.homeTeam.name} Győzelem (1)`,
    market: '1',
    getValue: (p) => p.homeWin,
    getOdds: (m) => m.odds.home,
  },
  {
    id: 'DRAW',
    label: 'X (Döntetlen) %',
    shortLabel: 'X (Dönt.)',
    marketName: () => 'Döntetlen (X)',
    market: 'X',
    getValue: (p) => p.draw,
    getOdds: (m) => m.odds.draw,
  },
  {
    id: 'AWAY_WIN',
    label: '2 (Vendég) %',
    shortLabel: '2 (Vendég)',
    marketName: (m) => `${m.awayTeam.name} Győzelem (2)`,
    market: '2',
    getValue: (p) => p.awayWin,
    getOdds: (m) => m.odds.away,
  },
  {
    id: 'FH_OVER_05',
    label: '1.F >0.5 %',
    shortLabel: 'HT >0.5',
    marketName: () => '1. félidő 0.5 gól felett',
    market: 'FH_OVER_05',
    getValue: (p) => p.fhOver05,
    getOdds: (m) => Number(Math.max(1.15, +(100 / Math.max(10, m.probabilities.fhOver05 * 0.94)).toFixed(2))),
  },
  {
    id: 'BTTS_AND_OVER25',
    label: 'BTTS & >2.5 %',
    shortLabel: 'BTTS & >2.5',
    marketName: () => 'BTTS és 2.5 gól felett',
    market: 'BTTS_AND_OVER25',
    getValue: (p) => p.bttsAndOver25 ?? Math.round((p.bttsYes * p.over25) / 100),
    getOdds: (m) => {
      const pVal = m.probabilities.bttsAndOver25 ?? Math.round((m.probabilities.bttsYes * m.probabilities.over25) / 100);
      return Number(Math.max(1.30, +(100 / Math.max(10, pVal * 0.90)).toFixed(2)));
    },
  },
];

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

  useEffect(() => {
    const handleLiveFilter = () => {
      setOnlyLiveMatches(true);
      setDayFilter('today');
      setSelectedLeague('all');
    };
    window.addEventListener('focitipp_filter_live', handleLiveFilter);
    return () => window.removeEventListener('focitipp_filter_live', handleLiveFilter);
  }, [setDayFilter]);

  useEffect(() => {
    const handleUpdate = () => {
      const val = parseInt(localStorage.getItem('focitipp_threshold') || '60', 10);
      setSignalThreshold(isNaN(val) ? 60 : val);
    };
    window.addEventListener('focitipp_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('focitipp_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

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
          m.leagueId === 'primeira_liga' || m.leagueId === 'ppl' ? 6 :
          m.leagueId === 'nbi' ? 7 :
          m.leagueId === 'eredivisie' || m.leagueId === 'ded' ? 8 :
          m.leagueId === 'ligue1' || m.leagueId === 'fl1' ? 9 :
          m.leagueId === 'championship' || m.leagueId === 'elc' ? 10 :
          m.leagueId === 'jupiler' ? 11 :
          m.leagueId === 'superlig' ? 12 :
          m.leagueId === 'austria_bundesliga' ? 13 :
          m.leagueId === 'swiss_superleague' ? 14 :
          m.leagueId === 'scot_prem' ? 15 :
          m.leagueId === 'ekstraklasa' ? 16 :
          m.leagueId === 'superleague_greece' ? 17 :
          m.leagueId === 'mls' ? 18 :
          m.leagueId === 'laliga2' ? 19 :
          m.leagueId === 'serieb' ? 20 :
          m.leagueId === 'bundesliga2' ? 21 :
          m.leagueId === 'ligue2' ? 22 :
          m.leagueId === 'seriea_brazil' || m.leagueId === 'bsa' ? 23 : 30;

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

  // Kedvenc meccsek kiszűrése az adott napra
  const favoriteMatches = useMemo(() => {
    if (favoriteMatchIds.size === 0) return [];
    return dayMatches.filter((m) => favoriteMatchIds.has(m.id));
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
    onAddToBetSlip({
      matchId: match.id,
      matchTitle: `${match.homeTeam.name} - ${match.awayTeam.name}`,
      marketLabel,
      market,
      odds,
      probability: prob,
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
                    matches={filteredMatches.sort((a, b) => a.kickoffTime.localeCompare(b.kickoffTime))}
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
                    matches={filteredMatches.sort((a, b) => a.kickoffTime.localeCompare(b.kickoffTime))}
                    onSelectMatch={onSelectMatch}
                    onCellBet={handleCellBet}
                    betSlipItems={betSlipItems}
                    focusMarket={focusMarket}
                    favoriteMatchIds={favoriteMatchIds}
                    onToggleFavorite={toggleFavoriteMatch}
                  />
                ) : (
                  <MatchTable
                    matches={filteredMatches.sort((a, b) => a.kickoffTime.localeCompare(b.kickoffTime))}
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

/* ================= SEGÉDKOMPONENS: TÁBLÁZAT ================= */
interface MatchTableProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onCellBet: (
    e: React.MouseEvent,
    match: Match,
    marketLabel: string,
    prob: number,
    odds: number,
    market?: PickMarket
  ) => void;
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
          <tr className="border-b border-slate-800 bg-mesh-dark text-slate-400 uppercase text-[10px] font-bold tracking-wider">
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
            const is1Selected = betSlipItems.some(
              (it) => it.matchId === match.id && (it.market === '1' || it.marketLabel.includes('(1)'))
            );
            const isXSelected = betSlipItems.some(
              (it) => it.matchId === match.id && (it.market === 'X' || it.marketLabel.includes('(X)'))
            );
            const is2Selected = betSlipItems.some(
              (it) => it.matchId === match.id && (it.market === '2' || it.marketLabel.includes('(2)'))
            );
            const isBttsSelected = betSlipItems.some(
              (it) => it.matchId === match.id && (it.market === 'BTTS' || it.market === 'BTTS_YES' || it.marketLabel.includes('BTTS'))
            );
            const isO25Selected = betSlipItems.some(
              (it) => it.matchId === match.id && (it.market === 'OVER_25' || it.marketLabel.includes('2.5'))
            );

            return (
              <tr
                key={match.id}
                onClick={() => onSelectMatch(match)}
                className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
              >
                {/* 1. KO / Állapot */}
                <td className="py-3 px-3 text-center">
                  {isFinished ? (
                    <div className="flex flex-col items-center justify-center">
                      <span className="inline-flex items-center gap-1 font-bold text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        FT
                      </span>
                      {(match.kickoffDate || match.kickoffTime) && (
                        <span className="text-[10px] font-mono text-slate-400 mt-1 whitespace-nowrap">
                          {match.kickoffDate ? match.kickoffDate.slice(5) : ''} {match.kickoffTime}
                        </span>
                      )}
                    </div>
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
                    onCellBet(e, match, `${match.homeTeam.name} (1)`, p.homeWin, match.odds.home, '1')
                  }
                  className={`py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 cursor-pointer ${cHome.bg} ${
                    is1Selected ? 'ring-2 ring-amber-400 font-bold' : ''
                  }`}
                  title={`Hazai siker: ${p.homeWin}% | Odds: ${match.odds.home}`}
                >
                  <div className="font-bold">{p.homeWin}%</div>
                  <div className="text-[9px] opacity-70 font-mono">{match.odds.home.toFixed(2)}</div>
                </td>

                {/* 4. X (Döntetlen) */}
                <td
                  onClick={(e) =>
                    onCellBet(e, match, 'Döntetlen (X)', p.draw, match.odds.draw, 'X')
                  }
                  className={`py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 cursor-pointer ${cDraw.bg} ${
                    isXSelected ? 'ring-2 ring-amber-400 font-bold' : ''
                  }`}
                  title={`Döntetlen: ${p.draw}% | Odds: ${match.odds.draw}`}
                >
                  <div className="font-bold">{p.draw}%</div>
                  <div className="text-[9px] opacity-70 font-mono">{match.odds.draw.toFixed(2)}</div>
                </td>

                {/* 5. 2 (Vendég Győzelem) */}
                <td
                  onClick={(e) =>
                    onCellBet(e, match, `${match.awayTeam.name} (2)`, p.awayWin, match.odds.away, '2')
                  }
                  className={`py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 cursor-pointer ${cAway.bg} ${
                    is2Selected ? 'ring-2 ring-amber-400 font-bold' : ''
                  }`}
                  title={`Vendég siker: ${p.awayWin}% | Odds: ${match.odds.away}`}
                >
                  <div className="font-bold">{p.awayWin}%</div>
                  <div className="text-[9px] opacity-70 font-mono">{match.odds.away.toFixed(2)}</div>
                </td>

                {/* 6. BTTS (Mindkét csapat gól) */}
                <td
                  onClick={(e) =>
                    onCellBet(e, match, 'Mindkét csapat szerez gólt (BTTS)', p.bttsYes, match.odds.bttsYes, 'BTTS_YES')
                  }
                  className={`py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 cursor-pointer ${cBtts.bg} ${
                    isBttsSelected ? 'ring-2 ring-amber-400 font-bold' : ''
                  }`}
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
                    onCellBet(e, match, '2.5 gól felett', p.over25, match.odds.over25, 'OVER_25')
                  }
                  className={`py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 cursor-pointer ${cO25.bg} ${
                    isO25Selected ? 'ring-2 ring-amber-400 font-bold' : ''
                  }`}
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

/* ================= SEGÉDKOMPONENS: RESZPONZÍV / MOBILOS KÁRTYA NÉZET ================= */
interface MatchCardsListProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onCellBet: (
    e: React.MouseEvent,
    match: Match,
    marketLabel: string,
    prob: number,
    odds: number,
    market?: PickMarket
  ) => void;
  betSlipItems: BetSlipItem[];
  focusMarket: FocusMarket;
  favoriteMatchIds?: Set<string>;
  onToggleFavorite?: (e: React.MouseEvent, matchId: string) => void;
}

const MatchCardsList: React.FC<MatchCardsListProps> = ({
  matches,
  onSelectMatch,
  onCellBet,
  betSlipItems,
  focusMarket,
  favoriteMatchIds,
  onToggleFavorite,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
      {matches.map((match) => {
        const p = match.probabilities;
        const isFinished = match.status === 'FINISHED';
        const isLive = match.status === 'LIVE';
        const pick = match.aiPick;
        const isPickAdded = pick
          ? betSlipItems.some((item) => item.matchId === match.id && item.marketLabel === pick.marketLabel)
          : false;
        const isFavorited = favoriteMatchIds?.has(match.id);

        return (
          <div
            key={match.id}
            onClick={() => onSelectMatch(match)}
            className="p-3.5 rounded-xl bg-mesh-card border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-md group"
          >
            {/* 1. Fejléc: Liga, Kezdés/Státusz, Adatminőség */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold truncate">
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={(e) => onToggleFavorite(e, match.id)}
                    className="p-1 rounded text-slate-600 hover:text-amber-400 transition-colors cursor-pointer mr-0.5"
                    title={isFavorited ? 'Eltávolítás a kedvencekből' : 'Kitűzés a kedvencekhez'}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isFavorited ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                )}
                <span>{match.leagueFlag}</span>
                <span className="truncate">{match.leagueName}</span>
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                {isFinished ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      FT
                    </span>
                    {(match.kickoffDate || match.kickoffTime) && (
                      <span className="font-mono text-[10px] text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-amber-400/80 shrink-0" />
                        <span>{match.kickoffDate}</span>
                        {match.kickoffTime && (
                          <>
                            <span className="text-slate-600">&bull;</span>
                            <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                            <span>{match.kickoffTime}</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                ) : isLive ? (
                  <span className="font-bold text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    ÉLŐ
                  </span>
                ) : (
                  <span className="font-mono text-amber-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {match.kickoffTime}
                  </span>
                )}
                {match.quantAnalysis && (
                  <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-900 px-1 py-0.5 rounded">
                    {match.quantAnalysis.dataQuality}-szint
                  </span>
                )}
              </div>
            </div>

            {/* 2. Csapatok & Eredmény / xG */}
            <div className="py-1 space-y-1.5 border-y border-slate-800/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={match.homeTeam.logo}
                    alt=""
                    className="w-4 h-4 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                    {match.homeTeam.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-slate-500">xG {match.homeTeam.xgAvg}</span>
                  {match.homeScore !== undefined && (
                    <span className="font-mono font-bold text-xs text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded">
                      {match.homeScore}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={match.awayTeam.logo}
                    alt=""
                    className="w-4 h-4 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-xs font-medium text-slate-200 truncate group-hover:text-amber-300 transition-colors">
                    {match.awayTeam.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-slate-500">xG {match.awayTeam.xgAvg}</span>
                  {match.awayScore !== undefined && (
                    <span className="font-mono font-bold text-xs text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded">
                      {match.awayScore}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Gyors Hőtérkép Pills (1, X, 2, BTTS, O2.5) */}
            <div className="grid grid-cols-5 gap-1 text-center">
              <button
                type="button"
                onClick={(e) => onCellBet(e, match, `${match.homeTeam.name} Győzelem (1)`, p.homeWin, match.odds.home, '1')}
                className={`p-1 rounded text-[10px] font-mono font-bold transition-all border ${getProbabilityColorClass(p.homeWin).bg} ${focusMarket === '1X2' ? 'ring-1 ring-amber-400' : ''}`}
                title={`Hazai: ${p.homeWin}% @${match.odds.home.toFixed(2)}`}
              >
                <span className="text-[8px] uppercase block opacity-70">1</span>
                <span>{p.homeWin}%</span>
              </button>

              <button
                type="button"
                onClick={(e) => onCellBet(e, match, 'Döntetlen (X)', p.draw, match.odds.draw, 'X')}
                className={`p-1 rounded text-[10px] font-mono font-bold transition-all border ${getProbabilityColorClass(p.draw).bg} ${focusMarket === '1X2' ? 'ring-1 ring-amber-400' : ''}`}
                title={`Döntetlen: ${p.draw}% @${match.odds.draw.toFixed(2)}`}
              >
                <span className="text-[8px] uppercase block opacity-70">X</span>
                <span>{p.draw}%</span>
              </button>

              <button
                type="button"
                onClick={(e) => onCellBet(e, match, `${match.awayTeam.name} Győzelem (2)`, p.awayWin, match.odds.away, '2')}
                className={`p-1 rounded text-[10px] font-mono font-bold transition-all border ${getProbabilityColorClass(p.awayWin).bg} ${focusMarket === '1X2' ? 'ring-1 ring-amber-400' : ''}`}
                title={`Vendég: ${p.awayWin}% @${match.odds.away.toFixed(2)}`}
              >
                <span className="text-[8px] uppercase block opacity-70">2</span>
                <span>{p.awayWin}%</span>
              </button>

              <button
                type="button"
                onClick={(e) => onCellBet(e, match, 'Mindkét csapat szerez gólt (BTTS)', p.bttsYes, match.odds.bttsYes, 'BTTS_YES')}
                className={`p-1 rounded text-[10px] font-mono font-bold transition-all border ${getProbabilityColorClass(p.bttsYes).bg} ${focusMarket === 'BTTS' ? 'ring-1 ring-amber-400' : ''}`}
                title={`BTTS: ${p.bttsYes}% @${match.odds.bttsYes.toFixed(2)}`}
              >
                <span className="text-[8px] uppercase block opacity-70">BTTS</span>
                <span>{p.bttsYes}%</span>
              </button>

              <button
                type="button"
                onClick={(e) => onCellBet(e, match, '2.5 gól felett', p.over25, match.odds.over25, 'OVER_25')}
                className={`p-1 rounded text-[10px] font-mono font-bold transition-all border ${getProbabilityColorClass(p.over25).bg} ${focusMarket === 'OVER_25' ? 'ring-1 ring-amber-400' : ''}`}
                title={`2.5 felett: ${p.over25}% @${match.odds.over25.toFixed(2)}`}
              >
                <span className="text-[8px] uppercase block opacity-70">&gt;2.5</span>
                <span>{p.over25}%</span>
              </button>
            </div>

            {/* 4. AI Ajánlott Tipp Sáv & Szelvény gomb */}
            {pick && (
              <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    MI Tipp:
                  </div>
                  <div className="text-[11px] font-extrabold text-amber-300 truncate">
                    {pick.marketLabel}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCellBet(e, match, pick.marketLabel, pick.probability, pick.odds, pick.market);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                      isPickAdded
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white border-slate-700'
                    }`}
                  >
                    @{pick.odds.toFixed(2)}
                  </button>

                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ================= SEGÉDKOMPONENS: SCORELAB STÍLUSÚ KOMPAKT MECCSSOROK ================= */
interface MatchCompactListProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onCellBet: (
    e: React.MouseEvent,
    match: Match,
    marketLabel: string,
    prob: number,
    odds: number,
    market?: PickMarket
  ) => void;
  betSlipItems: BetSlipItem[];
  metric1: GridMetricOption;
  metric2: GridMetricOption;
  favoriteMatchIds?: Set<string>;
  onToggleFavorite?: (e: React.MouseEvent, matchId: string) => void;
}

const MatchCompactList: React.FC<MatchCompactListProps> = ({
  matches,
  onSelectMatch,
  onCellBet,
  betSlipItems,
  metric1,
  metric2,
  favoriteMatchIds,
  onToggleFavorite,
}) => {
  return (
    <div className="divide-y divide-slate-800/60">
      {matches.map((match) => {
        const p = match.probabilities;
        const isFinished = match.status === 'FINISHED';
        const isLive = match.status === 'LIVE';

        // 1. Mutató számítás
        const val1 = metric1.getValue(p);
        const odds1 = metric1.getOdds(match);
        const label1 = metric1.marketName(match);
        const isBet1Selected = betSlipItems.some(
          (b) => b.matchId === match.id && b.marketLabel === label1
        );

        // 2. Mutató számítás
        const val2 = metric2.getValue(p);
        const odds2 = metric2.getOdds(match);
        const label2 = metric2.marketName(match);
        const isBet2Selected = betSlipItems.some(
          (b) => b.matchId === match.id && b.marketLabel === label2
        );

        // 1X2 piacok
        const homeLabel = `${match.homeTeam.name} Győzelem (1)`;
        const drawLabel = 'Döntetlen (X)';
        const awayLabel = `${match.awayTeam.name} Győzelem (2)`;

        const is1Selected = betSlipItems.some(
          (b) => b.matchId === match.id && b.marketLabel === homeLabel
        );
        const isXSelected = betSlipItems.some(
          (b) => b.matchId === match.id && b.marketLabel === drawLabel
        );
        const is2Selected = betSlipItems.some(
          (b) => b.matchId === match.id && b.marketLabel === awayLabel
        );

        const isFavorited = favoriteMatchIds?.has(match.id);

        return (
          <div
            key={match.id}
            onClick={() => onSelectMatch(match)}
            className="p-2 sm:p-2.5 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-1.5 sm:gap-3 cursor-pointer group"
          >
            {/* Bal oldal: Csillag + Hazai - Eredmény/Idő - Vendég */}
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
              {/* Kedvenc kitűző csillag */}
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={(e) => onToggleFavorite(e, match.id)}
                  className="p-1 rounded text-slate-600 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
                  title={isFavorited ? 'Eltávolítás a kedvencekből' : 'Kitűzés a kedvencekhez'}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      isFavorited ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              )}

              {/* Hazai Csapat (ScoreLab stílus: Logo felül, név alatta) */}
              <div className="flex flex-col items-center text-center w-16 sm:w-24 shrink-0">
                <img
                  src={match.homeTeam.logo}
                  alt=""
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-[10px] sm:text-xs font-bold text-white truncate w-full mt-0.5 group-hover:text-amber-300 transition-colors">
                  {match.homeTeam.name}
                </span>
              </div>

              {/* Középső Állapot / Idő / Eredmény */}
              <div className="flex flex-col items-center justify-center min-w-[46px] sm:min-w-[58px] shrink-0 px-0.5">
                {isFinished ? (
                  <>
                    <span className="font-mono font-black text-xs sm:text-sm text-amber-400 bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800">
                      {match.homeScore ?? 0} - {match.awayScore ?? 0}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-emerald-400 mt-0.5 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      FT
                    </span>
                    {(match.kickoffDate || match.kickoffTime) && (
                      <span className="text-[8px] font-mono text-slate-500 hidden sm:inline">
                        {match.kickoffDate ? match.kickoffDate.slice(5) : ''} {match.kickoffTime}
                      </span>
                    )}
                  </>
                ) : isLive ? (
                  <>
                    <span className="font-mono font-black text-xs sm:text-sm text-red-400 animate-pulse bg-red-950/50 px-1.5 py-0.5 rounded border border-red-500/30">
                      {match.homeScore ?? 0} - {match.awayScore ?? 0}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-red-400 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      {match.minute ? `${match.minute}'` : 'ÉLŐ'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-mono font-extrabold text-xs sm:text-sm text-white">
                      {match.kickoffTime}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                      VS
                    </span>
                  </>
                )}
              </div>

              {/* Vendég Csapat (ScoreLab stílus: Logo felül, név alatta) */}
              <div className="flex flex-col items-center text-center w-16 sm:w-24 shrink-0">
                <img
                  src={match.awayTeam.logo}
                  alt=""
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-[10px] sm:text-xs font-semibold text-slate-200 truncate w-full mt-0.5 group-hover:text-amber-300 transition-colors">
                  {match.awayTeam.name}
                </span>
              </div>
            </div>

            {/* Jobb oldal: 2 Dinamikus Pill Mutató + Mini 1X2 Oszlop */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
              {/* Két kiválasztott mutató csík-diagrammal */}
              <div className="flex flex-col gap-1 w-[90px] sm:w-28 shrink-0">
                {/* 1. Mutató Pill */}
                <button
                  type="button"
                  onClick={(e) => onCellBet(e, match, label1, val1, odds1, metric1.market)}
                  className={`h-5 sm:h-5.5 rounded relative overflow-hidden text-left border transition-all cursor-pointer ${
                    isBet1Selected
                      ? 'border-cyan-400 ring-1 ring-cyan-400 shadow-sm shadow-cyan-500/20 bg-slate-900'
                      : 'border-slate-700/80 hover:border-cyan-500/70 bg-slate-950/80'
                  }`}
                  title={`${metric1.label}: ${val1}% @${odds1.toFixed(2)} - Kattints a szelvényhez adáshoz`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600/50 to-blue-600/60 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, val1))}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-1.5 z-10 text-[8px] sm:text-[9px] font-bold">
                    <span className="text-white/90 truncate mr-0.5">{metric1.shortLabel}</span>
                    <span className="font-mono font-black text-cyan-200 shrink-0">
                      {val1}%
                      <span className="text-[7px] sm:text-[8px] opacity-70 ml-0.5 hidden sm:inline">@{odds1.toFixed(2)}</span>
                    </span>
                  </div>
                </button>

                {/* 2. Mutató Pill */}
                <button
                  type="button"
                  onClick={(e) => onCellBet(e, match, label2, val2, odds2, metric2.market)}
                  className={`h-5 sm:h-5.5 rounded relative overflow-hidden text-left border transition-all cursor-pointer ${
                    isBet2Selected
                      ? 'border-indigo-400 ring-1 ring-indigo-400 shadow-sm shadow-indigo-500/20 bg-slate-900'
                      : 'border-slate-700/80 hover:border-indigo-500/70 bg-slate-950/80'
                  }`}
                  title={`${metric2.label}: ${val2}% @${odds2.toFixed(2)} - Kattints a szelvényhez adáshoz`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600/50 to-purple-600/60 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, val2))}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-1.5 z-10 text-[8px] sm:text-[9px] font-bold">
                    <span className="text-white/90 truncate mr-0.5">{metric2.shortLabel}</span>
                    <span className="font-mono font-black text-indigo-200 shrink-0">
                      {val2}%
                      <span className="text-[7px] sm:text-[8px] opacity-70 ml-0.5 hidden sm:inline">@{odds2.toFixed(2)}</span>
                    </span>
                  </div>
                </button>
              </div>

              {/* Mini 1X2 Odds Stack (ScoreLab stílus) */}
              <div className="flex flex-col gap-0.5 shrink-0 bg-slate-950/80 p-0.5 sm:p-1 rounded border border-slate-800">
                <button
                  type="button"
                  onClick={(e) => onCellBet(e, match, homeLabel, p.homeWin, match.odds.home, '1')}
                  className={`px-1 sm:px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-mono font-semibold flex items-center justify-between gap-1 transition-all cursor-pointer ${
                    is1Selected
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`Hazai (1): @${match.odds.home.toFixed(2)} (${p.homeWin}%)`}
                >
                  <span className="text-slate-500 font-bold text-[7px] sm:text-[8px]">1</span>
                  <span>{match.odds.home.toFixed(2)}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => onCellBet(e, match, drawLabel, p.draw, match.odds.draw, 'X')}
                  className={`px-1 sm:px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-mono font-semibold flex items-center justify-between gap-1 transition-all cursor-pointer ${
                    isXSelected
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`Döntetlen (X): @${match.odds.draw.toFixed(2)} (${p.draw}%)`}
                >
                  <span className="text-slate-500 font-bold text-[7px] sm:text-[8px]">X</span>
                  <span>{match.odds.draw.toFixed(2)}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => onCellBet(e, match, awayLabel, p.awayWin, match.odds.away, '2')}
                  className={`px-1 sm:px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-mono font-semibold flex items-center justify-between gap-1 transition-all cursor-pointer ${
                    is2Selected
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`Vendég (2): @${match.odds.away.toFixed(2)} (${p.awayWin}%)`}
                >
                  <span className="text-slate-500 font-bold text-[7px] sm:text-[8px]">2</span>
                  <span>{match.odds.away.toFixed(2)}</span>
                </button>
              </div>

              {/* Részletek Chevron */}
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

