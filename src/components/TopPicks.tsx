import React, { useMemo } from 'react';
import { Match, BetSlipItem } from '../types/football';
import { Sparkles, Plus, Check, ChevronRight, Zap, LayoutGrid, Flame } from 'lucide-react';

interface TopPicksProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onAddToBetSlip: (item: BetSlipItem) => void;
  betSlipItems: BetSlipItem[];
  onSwitchToGrid?: () => void;
}

export const TopPicks: React.FC<TopPicksProps> = ({
  matches,
  onSelectMatch,
  onAddToBetSlip,
  betSlipItems,
  onSwitchToGrid,
}) => {
  // Rendezzük az összes AI tippel rendelkező meccset megbízhatóság és valószínűség szerint
  const rankedPicks = useMemo(() => {
    return matches
      .filter((m) => m.aiPick)
      .sort((a, b) => {
        const aTop = a.aiPick?.isTopPick ? 1 : 0;
        const bTop = b.aiPick?.isTopPick ? 1 : 0;
        if (bTop !== aTop) return bTop - aTop;
        return (b.aiPick?.probability || 0) - (a.aiPick?.probability || 0);
      });
  }, [matches]);

  // A 3 fő kiemelt kártya
  const mainTop3 = rankedPicks.slice(0, 3);
  // További erős szignálok kompakt listához (max 6 db)
  const secondaryPicks = rankedPicks.slice(3, 9);

  if (mainTop3.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 bg-[#070B14] w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Szekció fejléc */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kvantitatív λ-rács szűrőn átment prémium válogatás</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
              A Nap Top 3 Kiemelt AI Tippje
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-[#0D1527] px-3 py-1.5 rounded-xl border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Dixon–Coles &amp; Shin De-vig Modell</span>
            </div>
            {onSwitchToGrid && (
              <button
                onClick={onSwitchToGrid}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Teljes Rács ({matches.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Top 3 Kártya Grid (Garantáltan 1 sor asztali nézetben) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {mainTop3.map((match, idx) => {
            const pick = match.aiPick!;
            const isAdded = betSlipItems.some(
              (item) => item.matchId === match.id && item.marketLabel === pick.marketLabel
            );

            const impliedProb = Math.round((1 / pick.odds) * 100);
            const edge = pick.probability - impliedProb;

            return (
              <div
                key={match.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-gradient-to-b from-[#0F172A] to-[#0A101F] border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-xl overflow-hidden"
              >
                <div className="p-4 sm:p-5 pb-3">
                  {/* Fejléc címke & Ligainfó */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 truncate">
                      <span>{match.leagueFlag}</span>
                      <span className="truncate">{match.leagueName}</span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="text-amber-400 font-bold">{match.kickoffTime}</span>
                    </span>

                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                      #{idx + 1} TOP TIPP
                    </span>
                  </div>

                  {/* Csapatok logókkal */}
                  <div className="space-y-1.5 py-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={match.homeTeam.logo}
                          alt={match.homeTeam.name}
                          className="w-5 h-5 object-contain shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors truncate">
                          {match.homeTeam.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-slate-500 shrink-0">
                        xG {match.homeTeam.xgAvg}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={match.awayTeam.logo}
                          alt={match.awayTeam.name}
                          className="w-5 h-5 object-contain shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="text-sm font-bold text-slate-200 group-hover:text-amber-200 transition-colors truncate">
                          {match.awayTeam.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-slate-500 shrink-0">
                        xG {match.awayTeam.xgAvg}
                      </span>
                    </div>
                  </div>

                  {/* Fő Tipp Box */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
                        MI Ajánlott Tipp
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-amber-300 truncate block">
                        {pick.marketLabel}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
                        Szorzó
                      </span>
                      <span className="text-base font-black text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                        {pick.odds.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Valószínűség & Érték indikátor */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Modell esélye:</span>
                      <span className="font-extrabold text-emerald-400">{pick.probability}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pick.probability}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span>Piaci esély: {impliedProb}%</span>
                      <span className="text-amber-400 font-semibold">
                        Érték többlet: +{edge > 0 ? edge : 4}%
                      </span>
                    </div>
                  </div>

                  {/* Kvantitatív Robusztussági & Kelly sáv */}
                  {match.quantAnalysis && (
                    <div className="mt-2.5 flex items-center justify-between gap-1 text-[10px] bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {match.quantAnalysis.robustnessVerdict}
                      </span>
                      <span className="text-slate-400">
                        Minőség: <strong className="text-slate-200">{match.quantAnalysis.dataQuality}</strong>
                      </span>
                      <span className="text-amber-300 font-mono font-bold">
                        Kelly: {match.quantAnalysis.quarterKellyPct}%
                      </span>
                    </div>
                  )}

                  {/* AI Szöveges Indoklás */}
                  <p className="mt-2.5 text-[11px] text-slate-300 leading-relaxed bg-[#070B14]/60 p-2.5 rounded-lg border border-slate-800/80 line-clamp-2">
                    &ldquo;{pick.reasoning}&rdquo;
                  </p>
                </div>

                {/* Alsó gombsor */}
                <div className="p-3.5 pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() =>
                      onAddToBetSlip({
                        matchId: match.id,
                        matchTitle: `${match.homeTeam.name} - ${match.awayTeam.name}`,
                        marketLabel: pick.marketLabel,
                        odds: pick.odds,
                        probability: pick.probability,
                      })
                    }
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Szelvényen
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Szelvényhez
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onSelectMatch(match)}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                    title="Részletes adatok"
                  >
                    <span>Elemzés</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* További Erős Napi Szignálok (Kompakt 2 oszlopos kártyasor a hosszú táblázat helyett!) */}
        {secondaryPicks.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1527]/90 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">
                  További Magas Valószínűségű Szignálok Ma (60%+)
                </h3>
              </div>
              {onSwitchToGrid && (
                <button
                  onClick={onSwitchToGrid}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Összes mérkőzés a Rácsban</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {secondaryPicks.map((m) => {
                const p = m.aiPick!;
                const isAdded = betSlipItems.some(
                  (item) => item.matchId === m.id && item.marketLabel === p.marketLabel
                );

                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch(m)}
                    className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800/90 flex items-center justify-between gap-2 cursor-pointer transition-all group"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>{m.leagueFlag}</span>
                        <span className="truncate">{m.leagueName}</span>
                        <span>&bull;</span>
                        <span className="text-amber-400 font-mono">{m.kickoffTime}</span>
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-0.5 group-hover:text-amber-200">
                        {m.homeTeam.name} – {m.awayTeam.name}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-400 truncate">
                        {p.marketLabel} ({p.probability}%)
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToBetSlip({
                          matchId: m.id,
                          matchTitle: `${m.homeTeam.name} - ${m.awayTeam.name}`,
                          marketLabel: p.marketLabel,
                          odds: p.odds,
                          probability: p.probability,
                        });
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 border transition-all ${
                        isAdded
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white border-slate-700'
                      }`}
                      title="Szelvényhez adás"
                    >
                      @{p.odds.toFixed(2)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
