import React from 'react';
import { Match, BetSlipItem } from '../../types/football';
import { CheckCircle2, ChevronRight, Star } from 'lucide-react';
import { CellBetHandler, GridMetricOption } from './types';

export interface MatchCompactListProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onCellBet: CellBetHandler;
  betSlipItems: BetSlipItem[];
  metric1: GridMetricOption;
  metric2: GridMetricOption;
  favoriteMatchIds?: Set<string>;
  onToggleFavorite?: (e: React.MouseEvent, matchId: string) => void;
}

export const MatchCompactList: React.FC<MatchCompactListProps> = ({
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

            {/* Jobb oldal: 2 Dinamikus 3D Pill Mutató + Mini 1X2 Oszlop */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
              {/* Két kiválasztott mutató 3D csík-diagrammal */}
              <div className="flex flex-col gap-1.5 w-[96px] sm:w-[124px] shrink-0">
                {/* 1. Mutató 3D Pill */}
                <button
                  type="button"
                  onClick={(e) => onCellBet(e, match, label1, val1, odds1, metric1.market)}
                  className={`btn-pill-3d h-5.5 sm:h-6 rounded-lg relative overflow-hidden text-left border transition-all cursor-pointer ${
                    isBet1Selected
                      ? 'border-amber-400 border-b-amber-600 bg-amber-950/80 shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-1 ring-amber-400'
                      : 'border-cyan-500/50 border-b-cyan-900 hover:border-cyan-400 bg-slate-950/90'
                  }`}
                  title={`${metric1.label}: ${val1}% @${odds1.toFixed(2)} - Kattints a szelvényhez adáshoz`}
                >
                  {/* 3D szálcsiszolt / üvegfény kitöltés */}
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 pill-3d-gloss transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, val1))}%` }}
                  />
                  {/* Felső 3D élfény tükröződés */}
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-white/35 z-20 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-between px-1.5 z-10 text-[8px] sm:text-[9px] font-bold">
                    <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate mr-0.5">
                      {metric1.shortLabel}
                    </span>
                    <span className="font-mono font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] shrink-0">
                      {val1}%
                      <span className="text-[7px] sm:text-[8px] text-cyan-200 opacity-90 ml-0.5 hidden sm:inline">
                        @{odds1.toFixed(2)}
                      </span>
                    </span>
                  </div>
                </button>

                {/* 2. Mutató 3D Pill */}
                <button
                  type="button"
                  onClick={(e) => onCellBet(e, match, label2, val2, odds2, metric2.market)}
                  className={`btn-pill-3d h-5.5 sm:h-6 rounded-lg relative overflow-hidden text-left border transition-all cursor-pointer ${
                    isBet2Selected
                      ? 'border-amber-400 border-b-amber-600 bg-amber-950/80 shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-1 ring-amber-400'
                      : 'border-indigo-500/50 border-b-indigo-900 hover:border-indigo-400 bg-slate-950/90'
                  }`}
                  title={`${metric2.label}: ${val2}% @${odds2.toFixed(2)} - Kattints a szelvényhez adáshoz`}
                >
                  {/* 3D szálcsiszolt / üvegfény kitöltés */}
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-600 pill-3d-gloss transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, val2))}%` }}
                  />
                  {/* Felső 3D élfény tükröződés */}
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-white/35 z-20 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-between px-1.5 z-10 text-[8px] sm:text-[9px] font-bold">
                    <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate mr-0.5">
                      {metric2.shortLabel}
                    </span>
                    <span className="font-mono font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] shrink-0">
                      {val2}%
                      <span className="text-[7px] sm:text-[8px] text-indigo-200 opacity-90 ml-0.5 hidden sm:inline">
                        @{odds2.toFixed(2)}
                      </span>
                    </span>
                  </div>
                </button>
              </div>

              {/* Mini 1X2 Odds Stack (ScoreLab stílus) */}
              <div className="flex flex-col gap-0.5 shrink-0 bg-slate-950/80 p-0.5 sm:p-1 rounded-lg border border-slate-800 shadow-sm">
                <button
                  type="button"
                  onClick={(e) => onCellBet(e, match, homeLabel, p.homeWin, match.odds.home, '1')}
                  className={`btn-cell-3d px-1 sm:px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-mono font-semibold flex items-center justify-between gap-1 transition-all cursor-pointer ${
                    is1Selected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
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
                  className={`btn-cell-3d px-1 sm:px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-mono font-semibold flex items-center justify-between gap-1 transition-all cursor-pointer ${
                    isXSelected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
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
                  className={`btn-cell-3d px-1 sm:px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-mono font-semibold flex items-center justify-between gap-1 transition-all cursor-pointer ${
                    is2Selected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
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
