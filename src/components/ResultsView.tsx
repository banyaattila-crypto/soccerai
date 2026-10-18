import React, { useState, useMemo } from 'react';
import { Match } from '../types/football';
import {
  CheckCircle2,
  XCircle,
  Award,
  TrendingUp,
  ShieldCheck,
  Zap,
  Filter,
  Flame,
  BarChart3,
  Check,
  Archive,
  Calendar,
  Clock,
} from 'lucide-react';
import { MOCK_MATCHES } from '../data/mockMatches';
import { getArchivedFinishedMatches } from '../services/historyService';
import { getRelativeDateStr } from '../utils/dateUtils';

interface ResultsViewProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
}

export type MarketCategory = 'ALL' | 'COMBINED' | 'BTTS' | 'OVER_25' | '1X2' | 'UNDER_25';
export type StatusFilter = 'ALL' | 'WON' | 'LOST';

/**
 * Piac besorolása kategóriába a szűréshez és a statisztikai elemzéshez
 */
export function getMarketCategory(market?: string, marketLabel?: string): MarketCategory {
  const m = (market || '').toUpperCase();
  const l = (marketLabel || '').toLowerCase();

  if (m === 'BTTS_AND_OVER25' || (l.includes('btts') && (l.includes('2.5') || l.includes('over')))) {
    return 'COMBINED';
  }
  if (m === 'BTTS_YES' || l.includes('btts') || l.includes('mindkét')) {
    return 'BTTS';
  }
  if (m === 'OVER_25' || l.includes('2.5 gól felett') || l.includes('2.5 felett')) {
    return 'OVER_25';
  }
  if (m === 'UNDER_25' || l.includes('2.5 gól alatt') || l.includes('2.5 alatt')) {
    return 'UNDER_25';
  }
  if (['1', 'X', '2'].includes(m) || l.includes('győzelem') || l.includes('döntetlen')) {
    return '1X2';
  }
  return 'ALL';
}

/**
 * Valós matematikai eredmény-kiértékelő függvény a tényleges gólok és a piac alapján
 */
export function evaluatePickWon(
  homeScore?: number,
  awayScore?: number,
  market?: string,
  marketLabel?: string
): boolean | null {
  if (homeScore === undefined || awayScore === undefined || isNaN(homeScore) || isNaN(awayScore)) {
    return null;
  }
  const totalGoals = homeScore + awayScore;
  const label = (marketLabel || '').toLowerCase();
  const m = (market || '').toUpperCase();

  if (m === 'BTTS_AND_OVER25' || (label.includes('btts') && label.includes('2.5'))) {
    return homeScore > 0 && awayScore > 0 && totalGoals > 2.5;
  }
  if (m === 'OVER_25' || label.includes('2.5 gól felett') || label.includes('2.5 felett')) {
    return totalGoals > 2.5;
  }
  if (m === 'UNDER_25' || label.includes('2.5 gól alatt') || label.includes('2.5 alatt')) {
    return totalGoals < 2.5;
  }
  if (m === 'OVER_15' || label.includes('1.5 gól felett') || label.includes('1.5 felett')) {
    return totalGoals > 1.5;
  }
  if (m === 'BTTS_YES' || label.includes('mindkét csapat szerez gólt') || label.includes('btts')) {
    return homeScore > 0 && awayScore > 0;
  }
  if (m === '1' || label.includes('győzelem (1)')) {
    return homeScore > awayScore;
  }
  if (m === 'X' || label.includes('döntetlen (x)') || label.includes('döntetlen')) {
    return homeScore === awayScore;
  }
  if (m === '2' || label.includes('győzelem (2)')) {
    return awayScore > homeScore;
  }
  if (m === 'FH_OVER_05' || label.includes('félidő')) {
    return totalGoals >= 1;
  }

  // Alapértelmezett gólhatár ellenőrzés
  return totalGoals > 2.5;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ matches, onSelectMatch }) => {
  const [activeMarket, setActiveMarket] = useState<MarketCategory>('ALL');
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('ALL');
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK'>('ALL');

  const todayStr = useMemo(() => getRelativeDateStr(0), []);
  const yesterdayStr = useMemo(() => getRelativeDateStr(-1), []);

  // Alaptét a virtuális ROI és nyereségszámításhoz (10 000 Ft egységtét)
  const BASE_STAKE = 10000;

  // 1. Befejezett meccsek kinyerése és összefésülése a tartós helyi archívummal (sosem vesznek el)
  const isMockFallback = useMemo(() => {
    const liveFinished = matches.filter((m) => m.status === 'FINISHED');
    const archived = getArchivedFinishedMatches();
    return liveFinished.length === 0 && archived.length === 0;
  }, [matches]);

  const finishedMatches = useMemo(() => {
    const fromProps = matches.filter((m) => m.status === 'FINISHED');
    const archived = getArchivedFinishedMatches();
    const map = new Map<string, Match>();

    // Korábbi lementett meccsek
    archived.forEach((m) => map.set(m.id, m));
    // Aktuális friss lezárt meccsek
    fromProps.forEach((m) => map.set(m.id, m));

    if (map.size > 0) {
      return Array.from(map.values()).sort((a, b) => {
        const dateA = `${a.kickoffDate}T${a.kickoffTime || '00:00'}`;
        const dateB = `${b.kickoffDate}T${b.kickoffTime || '00:00'}`;
        return dateB.localeCompare(dateA); // legfrissebb felül
      });
    }

    return MOCK_MATCHES.filter((m) => m.status === 'FINISHED');
  }, [matches]);

  // 2. Minden lezárt meccs dinamikus kiértékelése és piacosítása
  const evaluatedAll = useMemo(() => {
    return finishedMatches.map((match) => {
      const pick = match.aiPick;
      const isWon = pick
        ? evaluatePickWon(match.homeScore, match.awayScore, pick.market, pick.marketLabel)
        : null;
      const category = getMarketCategory(pick?.market, pick?.marketLabel);
      const odds = pick?.odds || 1.5;
      const profit = isWon === true ? Math.round((odds - 1) * BASE_STAKE) : isWon === false ? -BASE_STAKE : 0;
      const returnAmount = isWon === true ? Math.round(odds * BASE_STAKE) : 0;

      return {
        match,
        pick,
        isWon,
        category,
        odds,
        profit,
        returnAmount,
      };
    });
  }, [finishedMatches]);

  // 3. Globális KPI mutatók kiszámítása
  const globalStats = useMemo(() => {
    const withPicks = evaluatedAll.filter((item) => item.isWon !== null);
    const totalCount = withPicks.length;
    const wonCount = withPicks.filter((item) => item.isWon === true).length;
    const winRate = totalCount > 0 ? (wonCount / totalCount) * 100 : 0;

    const totalStaked = totalCount * BASE_STAKE;
    const totalReturned = withPicks.reduce((acc, curr) => acc + curr.returnAmount, 0);
    const netProfit = totalReturned - totalStaked;
    const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;

    const winningOdds = withPicks.filter((item) => item.isWon === true).map((item) => item.odds);
    const avgWinningOdds =
      winningOdds.length > 0
        ? winningOdds.reduce((a, b) => a + b, 0) / winningOdds.length
        : 0;

    return {
      totalCount,
      wonCount,
      winRate,
      totalStaked,
      totalReturned,
      netProfit,
      roi,
      avgWinningOdds,
    };
  }, [evaluatedAll]);

  // 4. Piaci kategóriánkénti statisztikák az interaktív kártyákhoz
  const marketBreakdown = useMemo(() => {
    const categories: { id: MarketCategory; label: string; icon: typeof Zap; color: string }[] = [
      { id: 'COMBINED', label: 'BTTS & 2.5 Felett', icon: Zap, color: 'text-amber-400' },
      { id: 'BTTS', label: 'Mindkét Csapat Lő', icon: Flame, color: 'text-orange-400' },
      { id: 'OVER_25', label: '2.5 Gól Felett', icon: TrendingUp, color: 'text-emerald-400' },
      { id: '1X2', label: 'Csapat Győzelmek', icon: Award, color: 'text-blue-400' },
      { id: 'UNDER_25', label: '2.5 Gól Alatt', icon: ShieldCheck, color: 'text-teal-400' },
    ];

    return categories.map((cat) => {
      const items = evaluatedAll.filter((i) => i.category === cat.id && i.isWon !== null);
      const total = items.length;
      const won = items.filter((i) => i.isWon === true).length;
      const winRate = total > 0 ? Math.round((won / total) * 1000) / 10 : 0;
      const profit = items.reduce((acc, curr) => acc + curr.profit, 0);
      const roi = total > 0 ? Math.round((profit / (total * BASE_STAKE)) * 1000) / 10 : 0;

      return {
        ...cat,
        total,
        won,
        winRate,
        profit,
        roi,
      };
    });
  }, [evaluatedAll]);

  // 5. Elérhető ligák listája a szűrőhöz
  const distinctLeagues = useMemo(() => {
    const map = new Map<string, { id: string; name: string; flag: string }>();
    evaluatedAll.forEach(({ match }) => {
      if (!map.has(match.leagueId)) {
        map.set(match.leagueId, {
          id: match.leagueId,
          name: match.leagueName,
          flag: match.leagueFlag,
        });
      }
    });
    return Array.from(map.values());
  }, [evaluatedAll]);

  // 6. Szűrt meccsek listája
  const filteredList = useMemo(() => {
    return evaluatedAll.filter((item) => {
      // Időszak szűrő (Múltbeli eredmények tartós megőrzése és szűrése)
      if (periodFilter === 'TODAY' && item.match.kickoffDate !== todayStr) return false;
      if (periodFilter === 'YESTERDAY' && item.match.kickoffDate !== yesterdayStr) return false;
      if (periodFilter === 'WEEK') {
        const d = new Date(item.match.kickoffDate).getTime();
        const now = Date.now();
        if (Number.isNaN(d) || now - d > 7 * 24 * 60 * 60 * 1000) return false;
      }
      // Piac szűrő
      if (activeMarket !== 'ALL' && item.category !== activeMarket) {
        return false;
      }
      // Státusz szűrő
      if (activeStatus === 'WON' && item.isWon !== true) return false;
      if (activeStatus === 'LOST' && item.isWon !== false) return false;
      // Liga szűrő
      if (selectedLeague !== 'ALL' && item.match.leagueId !== selectedLeague) {
        return false;
      }
      return true;
    });
  }, [evaluatedAll, activeMarket, activeStatus, selectedLeague, periodFilter, todayStr, yesterdayStr]);

  return (
    <div className="py-8 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Demó adat figyelmeztető sáv, ha nincs élő lezárt meccs */}
        {isMockFallback && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between gap-2">
            <span>
              ⚠️ Demó adat (mintaarchívum): Az alábbi eredmények és ROI mutatók beépített minta-mérkőzéseken és szimulált szorzókon alapulnak.
            </span>
          </div>
        )}

        {/* 1. Fejléc & Fő KPI Vezérlőpult */}
        <div className="p-6 rounded-2xl bg-mesh-card border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <Award className="w-3.5 h-3.5" />
                <span>Szimulált Modell Teljesítmény &amp; Becsült ROI Archívum</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Legutóbbi Találatok &amp; Piac-specifikus Eredmények
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                A Dixon–Coles modell által adott előrejelzések végeredményei és szimulált szorzókkal (5% árrés) becsült megtérülése.
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  <Archive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tartós helyi archívum: <strong className="text-white">{finishedMatches.length} lezárt mérkőzés</strong></span>
                </span>
                <span className="text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5 font-mono">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  Egységtét: 10 000 Ft / tipp
                </span>
              </div>
            </div>

            {/* Időszak Szűrő Tabok */}
            <div className="flex items-center gap-1 bg-slate-900/95 p-1 rounded-xl border border-slate-800 self-start md:self-auto text-xs">
              <button
                onClick={() => setPeriodFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  periodFilter === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Összes ({finishedMatches.length})
              </button>
              <button
                onClick={() => setPeriodFilter('TODAY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  periodFilter === 'TODAY'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ma
              </button>
              <button
                onClick={() => setPeriodFilter('YESTERDAY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  periodFilter === 'YESTERDAY'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tegnap
              </button>
              <button
                onClick={() => setPeriodFilter('WEEK')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  periodFilter === 'WEEK'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7 nap
              </button>
            </div>
          </div>

          {/* Fő statisztikai kártyák sora */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Nyerési arány */}
            <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">
                Találati Arány (Win Rate)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {globalStats.winRate.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({globalStats.wonCount}/{globalStats.totalCount})
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Kiértékelt modell-előrejelzések
              </span>
            </div>

            {/* Virtuális ROI */}
            <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">
                Szimulált ROI (Becsült)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-2xl sm:text-3xl font-black ${
                    globalStats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {globalStats.roi >= 0 ? `+${globalStats.roi.toFixed(1)}%` : `${globalStats.roi.toFixed(1)}%`}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Becsült szorzókkal számított hozam
              </span>
            </div>

            {/* Nettó Profit */}
            <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">
                Szimulált Egyenleg Hatás
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono ${
                    globalStats.netProfit >= 0 ? 'text-amber-400' : 'text-red-400'
                  }`}
                >
                  {globalStats.netProfit >= 0
                    ? `+${globalStats.netProfit.toLocaleString('hu-HU')} Ft`
                    : `${globalStats.netProfit.toLocaleString('hu-HU')} Ft`}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {(globalStats.totalStaked / 1000).toFixed(0)}e Ft virtuális össztétre
              </span>
            </div>

            {/* Átlagos nyertes szorzó */}
            <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">
                Átlagos Becsült Odds
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                  @{globalStats.avgWinningOdds.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Szimulált piaci szorzó (5% árrés)
              </span>
            </div>
          </div>
        </div>

        {/* 2. Interaktív Piaci Teljesítmény Sáv (Market Breakdown Cards) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span className="uppercase tracking-wider text-[11px] font-bold text-slate-300">
              Piaci Sikerteljesítmény Bontás (Kattints a szűréshez)
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              Kattints a kívánt piacra a részletes mérkőzések listázásához
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {marketBreakdown.map((mb) => {
              const Icon = mb.icon;
              const isSelected = activeMarket === mb.id;

              return (
                <button
                  key={mb.id}
                  onClick={() => setActiveMarket(isSelected ? 'ALL' : mb.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950 border-amber-400 shadow-md shadow-amber-500/10 scale-[1.02]'
                      : 'bg-mesh-dark hover:border-slate-700 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Icon className={`w-3.5 h-3.5 ${mb.color}`} />
                      <span className="truncate">{mb.label}</span>
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-black text-white">{mb.winRate}%</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {mb.won}/{mb.total} nyert
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                      <span className="text-slate-500">Virtuális ROI:</span>
                      <span
                        className={`font-mono font-bold ${
                          mb.roi >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {mb.roi >= 0 ? `+${mb.roi}%` : `${mb.roi}%`}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Szűrősáv (Piac, Eredmény státusz, Bajnokság) */}
        <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Bal: Piac chipek */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-amber-400" />
              Piac:
            </span>

            {[
              { id: 'ALL', label: 'Összes Piac' },
              { id: 'COMBINED', label: 'BTTS & 2.5+' },
              { id: 'BTTS', label: 'BTTS' },
              { id: 'OVER_25', label: '2.5 Felett' },
              { id: '1X2', label: '1X2' },
              { id: 'UNDER_25', label: '2.5 Alatt' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveMarket(chip.id as MarketCategory)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeMarket === chip.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Jobb: Státusz és Liga szűrő */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Státusz fülválasztó */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
              <button
                onClick={() => setActiveStatus('ALL')}
                className={`px-2 py-0.5 rounded-md font-semibold ${
                  activeStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mind ({evaluatedAll.length})
              </button>
              <button
                onClick={() => setActiveStatus('WON')}
                className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                  activeStatus === 'WON'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                <Check className="w-3 h-3" />
                Nyert ({globalStats.wonCount})
              </button>
              <button
                onClick={() => setActiveStatus('LOST')}
                className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                  activeStatus === 'LOST'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-red-300'
                }`}
              >
                Vesztes ({globalStats.totalCount - globalStats.wonCount})
              </button>
            </div>

            {/* Liga választó legördülő */}
            {distinctLeagues.length > 1 && (
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="ALL">Minden bajnokság</option>
                {distinctLeagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* 4. Eredmény kártyák listája */}
        {filteredList.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-mesh-card border border-slate-800 space-y-3">
            <Filter className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Nincs a szűrésnek megfelelő lezárt mérkőzés</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Próbálj más piacot vagy ligát választani, vagy állítsd vissza a szűrőket az összes mérkőzés megtekintéséhez.
            </p>
            <button
              onClick={() => {
                setActiveMarket('ALL');
                setActiveStatus('ALL');
                setSelectedLeague('ALL');
              }}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
            >
              Szűrők visszaállítása
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map(({ match, pick, isWon, profit, category }) => {
              const isProfitPos = profit > 0;

              return (
                <div
                  key={match.id}
                  onClick={() => onSelectMatch(match)}
                  className="p-5 rounded-2xl bg-mesh-card border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-3.5 shadow-lg group hover:shadow-amber-500/5"
                >
                  {/* Fejléc: Liga, Dátum+Időpont és Piaci kategória címke */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-300 truncate">
                        <span>{match.leagueFlag}</span>
                        <span className="truncate">{match.leagueName}</span>
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
                          {category}
                        </span>
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                          LEZÁRULT
                        </span>
                      </div>
                    </div>

                    {/* Lejátszás időpontja: dátum + kezdési időpont */}
                    {(match.kickoffDate || match.kickoffTime) && (
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                        {match.kickoffDate && (
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            <Calendar className="w-3 h-3 text-amber-400/90 shrink-0" />
                            <span>{match.kickoffDate}</span>
                          </span>
                        )}
                        {match.kickoffDate && match.kickoffTime && (
                          <span className="text-slate-600">&bull;</span>
                        )}
                        {match.kickoffTime && (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{match.kickoffTime}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Csapatok összecsapása és eredmény */}
                  <div className="py-2.5 flex items-center justify-between border-y border-slate-800/80">
                    <div className="space-y-1.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={match.homeTeam.logo}
                          alt=""
                          className="w-5 h-5 object-contain shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="text-sm font-bold text-white truncate">
                          {match.homeTeam.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          src={match.awayTeam.logo}
                          alt=""
                          className="w-5 h-5 object-contain shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="text-sm font-medium text-slate-300 truncate">
                          {match.awayTeam.name}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono font-black text-xl text-amber-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                      <div>{match.homeScore}</div>
                      <div>{match.awayScore}</div>
                    </div>
                  </div>

                  {/* MI Tipp és Valós Hozam doboz */}
                  {pick && (
                    <div className="space-y-1.5">
                      <div
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isWon
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {isWon ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold block opacity-80">
                              {isWon ? 'NYERTES TIPP' : 'NEM JÖTT BE'}
                            </span>
                            <span className="font-extrabold truncate block">
                              {pick.marketLabel}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-xs bg-slate-900 px-2 py-0.5 rounded text-white block">
                            @{pick.odds.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Virtuális profit sor */}
                      <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                        <span>Virtuális egyenleg hatás:</span>
                        <span
                          className={`font-mono font-bold ${
                            isProfitPos ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isProfitPos
                            ? `+${profit.toLocaleString('hu-HU')} Ft`
                            : `${profit.toLocaleString('hu-HU')} Ft`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Rövid indoklás */}
                  {pick?.reasoning && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-2 pt-1 border-t border-slate-800/60">
                      &bdquo;{pick.reasoning}&ldquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
