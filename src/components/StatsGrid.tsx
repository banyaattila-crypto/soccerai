import React, { useState, useMemo } from 'react';
import { Match, DayFilter, ViewMode, BetSlipItem, FocusMarket } from '../types/football';
import { LEAGUES } from '../data/mockMatches';
import { getProbabilityColorClass } from '../services/predictionEngine';
import { Search, Filter, Sparkles, CheckCircle2, ChevronRight, Layers, Target } from 'lucide-react';

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
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('league');
  const [onlyStrongSignals, setOnlyStrongSignals] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusMarket, setFocusMarket] = useState<FocusMarket>('ALL');

  // Meccsek szűrése a nap szerint
  const dayMatches = useMemo(() => {
    let targetDate = '2026-10-17'; // Ma
    if (dayFilter === 'yesterday') targetDate = '2026-10-16';
    if (dayFilter === 'tomorrow') targetDate = '2026-10-18';

    return matches.filter((m) => m.kickoffDate === targetDate);
  }, [matches, dayFilter]);

  // Szűrés a többi kritérium alapján
  const filteredMatches = useMemo(() => {
    return dayMatches.filter((match) => {
      // Liga szűrés
      if (selectedLeague !== 'all' && match.leagueId !== selectedLeague) {
        return false;
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
  }, [dayMatches, selectedLeague, searchQuery, onlyStrongSignals]);

  // Csoportosítás bajnokság szerint ha viewMode === 'league'
  const groupedByLeague = useMemo(() => {
    const groups: { league: typeof LEAGUES[0]; matches: Match[] }[] = [];
    LEAGUES.forEach((league) => {
      const lm = filteredMatches.filter((m) => m.leagueId === league.id);
      if (lm.length > 0) {
        groups.push({ league, matches: lm });
      }
    });
    return groups;
  }, [filteredMatches]);

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
    <section className="py-8 bg-[#070B14]" id="stats-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Rács Fejléc és Vezérlők */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Statisztikai Esély Rács</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                {filteredMatches.length} mérkőzés
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Modell valószínűségek a mai és közelgő rangadókra. Minél zöldebb, annál valószínűbb a kimenetel.
            </p>
          </div>

          {/* Dátumválasztó Tabok (Tegnap / Ma / Holnap) */}
          <div className="flex items-center gap-1 bg-[#0D1527] p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setDayFilter('yesterday')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dayFilter === 'yesterday'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tegnap <span className="opacity-70 text-[10px]">(3)</span>
            </button>
            <button
              onClick={() => setDayFilter('today')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dayFilter === 'today'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ma <span className="opacity-70 text-[10px]">(9)</span>
            </button>
            <button
              onClick={() => setDayFilter('tomorrow')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dayFilter === 'tomorrow'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Holnap <span className="opacity-70 text-[10px]">(4)</span>
            </button>
          </div>
        </div>

        {/* Szűrők és Keresősáv */}
        <div className="p-4 rounded-2xl bg-[#0D1527]/80 border border-slate-800/80 mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Liga chipek */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedLeague('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedLeague === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Minden Bajnokság
              </button>
              {LEAGUES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLeague(l.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    selectedLeague === l.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.name}</span>
                </button>
              ))}
            </div>

            {/* Kereső */}
            <div className="relative w-full sm:w-64">
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

          {/* Másodlagos kapcsolók: Nézet & Erős jelek */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOnlyStrongSignals(!onlyStrongSignals)}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all ${
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
                className="px-2.5 py-1 rounded-md font-medium bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{viewMode === 'league' ? 'Nézet: Bajnokság szerint' : 'Nézet: Időrendben'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 hidden sm:block">
              Tipp: Kattints egy meccs sorára a részletes xG és H2H adatlaphoz!
            </div>
          </div>

          {/* 0. Lépés: Fókuszpiac kiválasztása (Profi Prompt módszertan) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-slate-800/60 pt-2 scrollbar-none">
            <span className="text-[11px] font-bold text-amber-400 whitespace-nowrap flex items-center gap-1 mr-1">
              <Target className="w-3.5 h-3.5" />
              Fókuszpiac:
            </span>
            {[
              { id: 'ALL', label: '[I] Minden piac' },
              { id: 'OVER_25', label: '[A] Over/Under 2.5' },
              { id: 'BTTS', label: '[B] BTTS (Mindkét gól)' },
              { id: '1X2', label: '[G] 1X2 Végeredmény' },
              { id: 'FH_OVER_05', label: '[D] 1.F Over 0.5' },
              { id: 'OVER_15', label: '[C] Over 1.5' },
            ].map((mkt) => (
              <button
                key={mkt.id}
                onClick={() => setFocusMarket(mkt.id as FocusMarket)}
                className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${
                  focusMarket === mkt.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {mkt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= TÁBLÁZAT(OK) ================= */}
        {filteredMatches.length === 0 ? (
          <div className="text-center py-16 bg-[#0D1527]/40 rounded-2xl border border-slate-800">
            <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white">Nincs a szűrőknek megfelelő mérkőzés</h3>
            <p className="text-xs text-slate-400 mt-1">Próbáld meg kikapcsolni a szűrőket vagy válassz másik napot.</p>
          </div>
        ) : viewMode === 'league' ? (
          /* Bajnokságonkénti csoportosítás */
          <div className="space-y-6">
            {groupedByLeague.map(({ league, matches: lMatches }) => (
              <div
                key={league.id}
                className="rounded-2xl bg-[#0D1527] border border-slate-800/90 overflow-hidden shadow-lg"
              >
                {/* Bajnokság Fejléc */}
                <div className="px-5 py-3 bg-[#0F182E] border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{league.flag}</span>
                    <span className="font-extrabold text-sm text-white tracking-wide">
                      {league.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({league.country} &bull; {lMatches.length} mérkőzés)
                    </span>
                  </div>
                </div>

                {/* Táblázat */}
                <MatchTable
                  matches={lMatches}
                  onSelectMatch={onSelectMatch}
                  onCellBet={handleCellBet}
                  betSlipItems={betSlipItems}
                  focusMarket={focusMarket}
                />
              </div>
            ))}
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
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
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
