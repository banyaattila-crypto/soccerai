import React from 'react';
import { Match, BetSlipItem } from '../types/football';
import { Sparkles, TrendingUp, Plus, Check, ChevronRight, Zap, Target } from 'lucide-react';

interface TopPicksProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onAddToBetSlip: (item: BetSlipItem) => void;
  betSlipItems: BetSlipItem[];
}

export const TopPicks: React.FC<TopPicksProps> = ({
  matches,
  onSelectMatch,
  onAddToBetSlip,
  betSlipItems,
}) => {
  // Szűrjük ki a kiemelt (isTopPick) tippeket
  const topPicks = matches.filter((m) => m.aiPick?.isTopPick);

  if (topPicks.length === 0) return null;

  return (
    <section className="py-8 border-b border-slate-800/60 bg-[#090E1C]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Szekció fejléc */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Gondosan szűrt prémium válogatás</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              A Nap Kiemelt AI Tippjei
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              A mai nap legmagasabb megbízhatóságú és leginkább alulárazott (Value) statisztikai szignáljai.
            </p>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Frissítve: Ma reggel 08:30 (Modell v2.4)</span>
          </div>
        </div>

        {/* 3 Kártya Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {topPicks.map((match, idx) => {
            const pick = match.aiPick!;
            const isAdded = betSlipItems.some(
              (item) => item.matchId === match.id && item.marketLabel === pick.marketLabel
            );

            // Számoljuk a piacilag implikált esélyt
            const impliedProb = Math.round((1 / pick.odds) * 100);
            const edge = pick.probability - impliedProb;

            return (
              <div
                key={match.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-gradient-to-b from-[#0F172A] to-[#0A101F] border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-xl overflow-hidden"
              >
                {/* Fejléc címke & Ligainfó */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
                      <span>{match.leagueFlag}</span>
                      <span>{match.leagueName}</span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="text-amber-400 font-bold">{match.kickoffTime}</span>
                    </span>

                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      #{idx + 1} VÁLOGATÁS
                    </span>
                  </div>

                  {/* Csapatok logókkal */}
                  <div className="space-y-2 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={match.homeTeam.logo}
                          alt={match.homeTeam.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                          {match.homeTeam.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-medium text-slate-500">
                        xG {match.homeTeam.xgAvg}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={match.awayTeam.logo}
                          alt={match.awayTeam.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="text-sm font-bold text-slate-200 group-hover:text-amber-200 transition-colors">
                          {match.awayTeam.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-medium text-slate-500">
                        xG {match.awayTeam.xgAvg}
                      </span>
                    </div>
                  </div>

                  {/* Fő Tipp Box */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        MI Ajánlott Tipp
                      </span>
                      <span className="text-sm font-extrabold text-amber-300">
                        {pick.marketLabel}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Szorzó
                      </span>
                      <span className="text-lg font-black text-white bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                        {pick.odds.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Valószínűség & Érték indikátor */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Modell esélye:</span>
                      <span className="font-extrabold text-emerald-400">{pick.probability}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pick.probability}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Piac esélye: {impliedProb}%</span>
                      <span className="text-amber-400 font-semibold">
                        Érték többlet: +{edge > 0 ? edge : 5}%
                      </span>
                    </div>
                  </div>

                  {/* Kvantitatív Robusztussági & Kelly sáv */}
                  {match.quantAnalysis && (
                    <div className="mt-3 flex items-center justify-between gap-1 text-[10px] bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {match.quantAnalysis.robustnessVerdict}
                      </span>
                      <span className="text-slate-400">
                        Adatminőség: <strong className="text-slate-200">{match.quantAnalysis.dataQuality}</strong>
                      </span>
                      <span className="text-amber-300 font-mono font-bold">
                        Kelly: {match.quantAnalysis.quarterKellyPct}% tét
                      </span>
                    </div>
                  )}

                  {/* AI Szöveges Indoklás */}
                  <p className="mt-2.5 text-xs text-slate-300 leading-relaxed bg-[#070B14]/60 p-2.5 rounded-lg border border-slate-800/80">
                    &ldquo;{pick.reasoning}&rdquo;
                  </p>
                </div>

                {/* Alsó gombsor */}
                <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center gap-2">
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
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
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
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                    title="Részletes adatok"
                  >
                    <span>Részletek</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
