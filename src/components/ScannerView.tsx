import React, { useState, useMemo } from 'react';
import { Match, BetSlipItem } from '../types/football';
import {
  extractOpportunitiesFromMatches,
  filterAndSortOpportunities,
  computeLeagueRadarStats,
  ScannerPreset,
  ScannerSortBy,
} from '../services/scannerService';
import {
  Radar,
  Zap,
  TrendingUp,
  Flame,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Check,
  Eye,
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
  // Állapotok
  const [activePreset, setActivePreset] = useState<ScannerPreset>('best_ev');
  const [activeSubTab, setActiveSubTab] = useState<'opportunities' | 'league_radar'>('opportunities');
  const [dayFilter, setDayFilter] = useState<'today' | 'tomorrow' | 'all' | 'yesterday'>('today');
  const [statusFilter, setStatusFilter] = useState<'open_only' | 'all' | 'finished'>('open_only');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [minProb, setMinProb] = useState<number>(50);
  const [sortBy, setSortBy] = useState<ScannerSortBy>('ev');

  // Összes lehetőség kinyerése
  const allOpportunities = useMemo(() => {
    return extractOpportunitiesFromMatches(matches);
  }, [matches]);

  // Szűrt és rendezett lehetőségek
  const filteredOpportunities = useMemo(() => {
    return filterAndSortOpportunities(allOpportunities, {
      preset: activePreset,
      minProb,
      leagueId: selectedLeague,
      dayFilter,
      statusFilter,
      searchQuery,
      sortBy,
    });
  }, [allOpportunities, activePreset, minProb, selectedLeague, dayFilter, statusFilter, searchQuery, sortBy]);

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

  // KPI mutatók
  const positiveEvCount = useMemo(() => {
    return allOpportunities.filter((o) => o.expectedValue > 0).length;
  }, [allOpportunities]);

  const highOverCount = useMemo(() => {
    return allOpportunities.filter((o) => o.market === 'OVER_25' && o.probability >= 65).length;
  }, [allOpportunities]);

  const presets: { id: ScannerPreset; label: string; icon: React.ReactNode }[] = [
    { id: 'best_ev', label: '💎 +EV Értéktippek', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'ai_picks', label: '🎯 Kiemelt MI Tippek', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'over_25', label: '⚽ Over 2.5 Gólradar', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'btts', label: '🥅 Mindkét Csapat Lő', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'favorites', label: '🛡️ Erős Favoritok', icon: <Trophy className="w-3.5 h-3.5" /> },
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
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
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
              Találatok: <span className="font-bold text-emerald-400">{filteredOpportunities.length}</span> db lehetőség
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
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.icon}
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Szűrő és Rendezősáv */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs">
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
          </div>

          {/* Találati Kártyák */}
          {filteredOpportunities.length > 0 ? (
            <div className="space-y-2.5">
              {filteredOpportunities.map((opp) => {
                const isAdded = betSlipItems.some(
                  (item) => item.matchId === opp.match.id && item.marketLabel === opp.marketLabel
                );
                const isPositiveEv = opp.expectedValue > 0;

                return (
                  <div
                    key={opp.id}
                    className="p-3.5 rounded-xl bg-mesh-dark border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md"
                  >
                    {/* Bal oldal: Meccs & Bajnokság */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-slate-400 text-xs">
                        <span className="text-base">{opp.match.leagueFlag}</span>
                        <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wide">
                          {opp.match.leagueName}
                        </span>
                        <span className="text-slate-600">&bull;</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{opp.match.kickoffDate}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-300">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{opp.match.kickoffTime}</span>
                        </span>
                        {opp.isRealOdds && opp.bookmakerName && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            {opp.bookmakerName}
                          </span>
                        )}
                      </div>

                      {/* Csapatok összecsapása */}
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white truncate">
                          {opp.match.homeTeam.name}
                        </span>
                        <span className="text-xs font-bold text-slate-500">vs</span>
                        <span className="font-extrabold text-sm text-white truncate">
                          {opp.match.awayTeam.name}
                        </span>
                      </div>

                      {/* Magyarázat */}
                      {opp.reasoning && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xl">
                          {opp.reasoning}
                        </p>
                      )}
                    </div>

                    {/* Közép: Piac, Esély és Odds */}
                    <div className="flex items-center gap-3 shrink-0 py-1 md:py-0">
                      {/* Piac neve */}
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-300 block truncate max-w-[180px]">
                          {opp.marketLabel}
                        </span>
                        <div className="flex items-center gap-2 justify-end mt-0.5">
                          <span className="font-mono text-xs font-black text-emerald-400">
                            {opp.probability}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">esély</span>
                        </div>
                      </div>

                      {/* Odds kapszula */}
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 text-center min-w-[70px]">
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Odds</span>
                        <span className="text-sm font-black text-white font-mono">
                          {opp.odds.toFixed(2)}
                        </span>
                      </div>

                      {/* Várható érték (+EV) */}
                      <div
                        className={`p-2 rounded-lg border text-center min-w-[70px] ${
                          isPositiveEv
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-[9px] uppercase block font-bold">Várható Él</span>
                        <span className="text-xs font-black font-mono">
                          {opp.expectedValue > 0 ? `+${opp.expectedValue}%` : `${opp.expectedValue}%`}
                        </span>
                      </div>
                    </div>

                    {/* Jobb oldal: Akció gombok */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                      <button
                        onClick={() => onSelectMatch(opp.match)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                        title="Meccs részletes elemzés (H2H & Poisson Mátrix)"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          onAddToBetSlip({
                            matchId: opp.match.id,
                            matchTitle: `${opp.match.homeTeam.name} - ${opp.match.awayTeam.name}`,
                            marketLabel: opp.marketLabel,
                            market: opp.market,
                            odds: opp.odds,
                            probability: opp.probability,
                            quarterKellyPct: opp.quarterKellyPct,
                          });
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-black'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Szelvényen</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tét</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2">
              <Radar className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-400">
                Nem található a szűrésnek megfelelő fogadási lehetőség
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Próbáld meg csökkenteni a minimum esély küszöböt, vagy válts az „Összes Lehetőség” presetre.
              </p>
            </div>
          )}

        </div>
      ) : (
        /* Liga Statisztikai Radar Nézet */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Radar className="w-4 h-4 text-blue-400" />
              Bajnokságok Kvantitatív Gól- és Értékradara
            </span>
            <span className="text-[11px] text-slate-400">
              Rendezve a legmagasabb várható gólátlag (xG) szerint
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {leagueRadarStats.map((stat, idx) => (
              <div
                key={stat.leagueId}
                className="p-4 rounded-xl bg-mesh-dark border border-slate-800/80 hover:border-slate-700 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{stat.leagueFlag}</span>
                    <div>
                      <div className="font-extrabold text-sm text-white">{stat.leagueName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {stat.leagueCountry} &bull; {stat.matchCount} meccs a kínálatban
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    #{idx + 1}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[9px] text-slate-400 block font-bold">Várható xG</span>
                    <span className="text-sm font-black text-amber-400 font-mono">
                      {stat.avgExpectedGoals}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[9px] text-slate-400 block font-bold">&gt; 2.5 Gól</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {stat.avgOver25Prob}%
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[9px] text-slate-400 block font-bold">BTTS Esély</span>
                    <span className="text-sm font-black text-teal-400 font-mono">
                      {stat.avgBttsProb}%
                    </span>
                  </div>
                </div>

                {stat.topOver25Match && (
                  <div className="text-[11px] p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-300 flex items-center justify-between">
                    <span className="text-slate-500 text-[10px]">Top gólvárakozás:</span>
                    <span className="font-semibold truncate text-white ml-1">
                      {stat.topOver25Match}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
