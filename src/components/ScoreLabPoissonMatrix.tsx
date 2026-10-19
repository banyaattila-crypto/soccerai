import React, { useState } from 'react';
import { Match } from '../types/football';
import { getDixonColesScoreMatrix, ScoreMatrixCell } from '../services/scoreLabService';
import {
  Grid3X3,
  Sparkles,
  Trophy,
  Info,
  Layers,
} from 'lucide-react';

interface ScoreLabPoissonMatrixProps {
  match: Match;
}

export const ScoreLabPoissonMatrix: React.FC<ScoreLabPoissonMatrixProps> = ({ match }) => {
  const report = getDixonColesScoreMatrix(match);
  const { matrix5x5, topScores, lh, la, rho, outcomeZones, goalsDistribution, mostLikelyTotal } = report;

  const [selectedCell, setSelectedCell] = useState<ScoreMatrixCell | null>(null);

  // Cellaszín intenzitás számítása a valószínűség alapján
  const getCellBgClass = (pct: number, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 font-black shadow-lg scale-105 z-10';
    }
    if (pct >= 11) {
      return 'bg-emerald-500/40 text-emerald-200 border-emerald-400/60 font-bold';
    }
    if (pct >= 7) {
      return 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40 font-semibold';
    }
    if (pct >= 4) {
      return 'bg-slate-800/80 text-slate-300 border-slate-700/60';
    }
    if (pct >= 2) {
      return 'bg-slate-900/60 text-slate-400 border-slate-800/60';
    }
    return 'bg-slate-950/40 text-slate-500 border-slate-900/40 opacity-70';
  };

  return (
    <div className="space-y-4 animate-fade-in text-slate-200">
      
      {/* 1. Felső Dixon-Coles paraméter sáv */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-[#0F1E38] border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-500/20 text-blue-400">
              <Grid3X3 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Bivariáns Dixon-Coles Poisson Gólmátrix
            </span>
          </div>
          <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
            <span>
              $\lambda_H$={lh.toFixed(2)} ({match.homeTeam.shortName || match.homeTeam.name})
            </span>
            <span className="text-slate-600">&bull;</span>
            <span>
              $\lambda_A$={la.toFixed(2)} ({match.awayTeam.shortName || match.awayTeam.name})
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="font-mono text-slate-400">$\rho$={rho} korrekció</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">Leggyakoribb gólszám</span>
            <span className="text-xs font-bold text-amber-300 font-mono">
              {mostLikelyTotal}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top 6 Legvalószínűbb Pontos Végeredmény */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-400" />
            Top 6 Legvalószínűbb Végeredmény
          </span>
          <span className="text-[11px] text-slate-400">
            Valószínűség &bull; Fair Odds ($1/p$)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {topScores.map((score, index) => {
            const isFirst = index === 0;
            return (
              <div
                key={score.label}
                onClick={() => {
                  const h = Math.min(4, score.homeScore);
                  const a = Math.min(4, score.awayScore);
                  setSelectedCell(matrix5x5[h][a]);
                }}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isFirst
                    ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-950/90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <span className="text-sm font-black font-mono text-white">
                      {score.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      score.zone === 'home'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : score.zone === 'away'
                        ? 'text-teal-400 bg-teal-500/10'
                        : 'text-amber-300 bg-amber-500/10'
                    }`}
                  >
                    {score.zone === 'home' ? '1' : score.zone === 'away' ? '2' : 'X'}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="font-bold text-emerald-400 font-mono">
                    {score.probabilityPct}%
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    Fair: <strong className="text-slate-200">{score.fairOdds.toFixed(2)}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. A Hőtérkép Mátrix (5x5 Grid) */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Eredmény Mátrix Hőtérkép
          </span>
          <span className="text-[10px] text-slate-400 italic">
            Kattints a cellára a fair oddshoz
          </span>
        </div>

        {/* Mátrix táblázat */}
        <div className="overflow-x-auto">
          <div className="min-w-[340px] space-y-1.5">
            
            {/* Fejléc: Vendég gólok (X tengely) */}
            <div className="grid grid-cols-6 gap-1 text-center items-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase truncate">
                Hazai \ Vendég
              </div>
              {[0, 1, 2, 3, '4+'].map((col, idx) => (
                <div key={idx} className="text-xs font-bold text-teal-400 font-mono py-1">
                  {col} gól
                </div>
              ))}
            </div>

            {/* Mátrix sorok: Hazai gólok (Y tengely) */}
            {matrix5x5.map((row, rIdx) => {
              const rowLabel = rIdx === 4 ? '4+ gól' : `${rIdx} gól`;
              return (
                <div key={rIdx} className="grid grid-cols-6 gap-1 items-center">
                  {/* Hazai gól címke */}
                  <div className="text-xs font-bold text-emerald-400 font-mono text-center truncate pr-1">
                    {rowLabel}
                  </div>

                  {/* Cellák */}
                  {row.map((cell, cIdx) => {
                    const isSelected =
                      selectedCell?.homeGoals === cell.homeGoals &&
                      selectedCell?.awayGoals === cell.awayGoals;

                    return (
                      <button
                        key={cIdx}
                        onClick={() => setSelectedCell(cell)}
                        className={`py-2 px-1 rounded-md border text-center transition-all ${getCellBgClass(
                          cell.pct,
                          isSelected
                        )}`}
                      >
                        <div className="text-xs font-black font-mono leading-tight">
                          {cell.pct}%
                        </div>
                        <div className="text-[9px] opacity-80 font-mono">
                          {cell.homeGoals === 4 ? '4+' : cell.homeGoals}-
                          {cell.awayGoals === 4 ? '4+' : cell.awayGoals}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Kiválasztott cella infó buborék */}
        {selectedCell ? (
          <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/40 flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-black text-sm font-mono">
                {selectedCell.homeGoals === 4 ? '4+' : selectedCell.homeGoals} - {selectedCell.awayGoals === 4 ? '4+' : selectedCell.awayGoals}
              </span>
              <span className="text-slate-400">
                kimenetel: <strong className="text-white">{selectedCell.pct}%</strong> modell esély
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-400">Fair szorzó:</span>
              <span className="text-amber-300 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {selectedCell.fairOdds.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 inline-block border border-emerald-400/50" />
              <span>Magas valószínűség (&gt;10%)</span>
              <span className="w-2.5 h-2.5 rounded bg-slate-800/80 inline-block border border-slate-700 ml-2" />
              <span>Közepes / Alacsony</span>
            </div>
            <span className="italic">Kattints a részletekért</span>
          </div>
        )}
      </div>

      {/* 4. Gólszám és Kimeneteli Zónák Összegzése */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        
        {/* Gólszám intervallumok */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800/80 pb-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Gólszám Intervallumok
          </div>
          <div className="space-y-1.5 pt-0.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">0 - 1 Gól (Under 1.5)</span>
              <span className="font-mono font-bold text-white">{goalsDistribution.under15Pct}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                style={{ width: `${goalsDistribution.under15Pct}%` }}
                className="bg-slate-400 h-full rounded-full"
              />
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">2 - 3 Gól (Fő sáv)</span>
              <span className="font-mono font-bold text-emerald-400">{goalsDistribution.mid23Pct}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                style={{ width: `${goalsDistribution.mid23Pct}%` }}
                className="bg-emerald-500 h-full rounded-full"
              />
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">4+ Gól (Over 3.5)</span>
              <span className="font-mono font-bold text-teal-400">{goalsDistribution.over35Pct}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                style={{ width: `${goalsDistribution.over35Pct}%` }}
                className="bg-teal-500 h-full rounded-full"
              />
            </div>
          </div>
        </div>

        {/* 1X2 Mátrix Zónák */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800/80 pb-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            Mátrix Kimeneteli Zónák
          </div>
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800/60 text-[11px]">
              <span className="text-emerald-400 font-semibold truncate">Hazai Zóna (Alsó háromszög)</span>
              <span className="font-mono font-bold text-white">{outcomeZones.homeWinPct}%</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800/60 text-[11px]">
              <span className="text-amber-300 font-semibold truncate">Döntetlen Zóna (Főátló)</span>
              <span className="font-mono font-bold text-white">{outcomeZones.drawPct}%</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800/60 text-[11px]">
              <span className="text-teal-400 font-semibold truncate">Vendég Zóna (Felső háromszög)</span>
              <span className="font-mono font-bold text-white">{outcomeZones.awayWinPct}%</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
