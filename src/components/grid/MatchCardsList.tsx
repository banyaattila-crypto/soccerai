import { formatKickoffShort } from '../../utils/kickoffFormat';
import { MarketGapChip } from '../MarketGapChip';
import { isMatchLive } from '../../utils/matchStatus';
import React from 'react';
import { Match, BetSlipItem, FocusMarket } from '../../types/football';
import { getProbabilityColorClass } from '../../services/predictionEngine';
import { CheckCircle2, ChevronRight, Calendar, Clock, Star } from 'lucide-react';
import { CellBetHandler } from './types';

export interface MatchCardsListProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onCellBet: CellBetHandler;
  betSlipItems: BetSlipItem[];
  focusMarket: FocusMarket;
  favoriteMatchIds?: Set<string>;
  onToggleFavorite?: (e: React.MouseEvent, matchId: string) => void;
}

export const MatchCardsList: React.FC<MatchCardsListProps> = ({
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
        const isLive = isMatchLive(match);
        const pick = match.aiPick;
        const isPickAdded = pick
          ? betSlipItems.some(
              (item) => item.matchId === match.id && item.marketLabel === pick.marketLabel
            )
          : false;
        const isFavorited = favoriteMatchIds?.has(match.id);

        return (
          <div
            key={match.id}
            onClick={() => onSelectMatch(match)}
            className="p-4 sm:p-5 rounded-2xl bg-mesh-card border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between gap-3.5 shadow-md group"
          >
            {/* 1. Fejléc: Liga, Kezdés/Státusz, Adatminőség */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold truncate">
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
                    <span className="font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      FT
                    </span>
                    {(match.kickoffDate || match.kickoffTime) && (
                      <span className="font-mono text-xs text-slate-300 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400/80 shrink-0" />
                        <span>{match.kickoffDate}</span>
                        {match.kickoffTime && (
                          <>
                            <span className="text-slate-600">&bull;</span>
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{match.kickoffTime}</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                ) : isLive ? (
                  <span className="font-bold text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/25 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    ÉLŐ
                  </span>
                ) : match.liveStale ? (
                  <span
                    className="font-bold text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-dashed border-slate-600"
                    title="A mérkőzés a kezdés óta eltelt idő alapján véget ért; a végeredményt a forrás még nem jelentette"
                  >
                    Lefújva · frissül
                  </span>
                ) : (
                  <span className="font-mono text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-xs">
                    {formatKickoffShort(match)}
                  </span>
                )}
                {(isLive || match.liveStale) && !isFinished && (
                  <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">{formatKickoffShort(match)}</span>
                )}
                {match.probabilitySource === 'market' && (
                  <span
                    className="text-[10px] text-blue-200 font-bold bg-blue-500/15 px-1.5 py-0.5 rounded-md border border-blue-500/40"
                    title="Az 1X2 és az Over/Under 2.5 esély a valós bukmékeri szorzókból (de-vigelt piaci ár), nem a modellből"
                  >
                    Piaci ár
                  </span>
                )}
                <MarketGapChip match={match} compact />
                {match.quantAnalysis && (
                  <span className="text-[11px] text-slate-400 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-800">
                    {match.quantAnalysis.dataQuality}-szint
                  </span>
                )}
              </div>
            </div>

            {/* 2. Csapatok & Eredmény / xG */}
            <div className="py-2 space-y-2 border-y border-slate-800/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={match.homeTeam.logo}
                    alt=""
                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                    {match.homeTeam.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-slate-400">
                    Vár. gól {match.homeTeam.xgAvg}
                  </span>
                  {match.homeScore !== undefined && (
                    <span className="font-mono font-black text-sm text-amber-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                      {match.homeScore}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={match.awayTeam.logo}
                    alt=""
                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-sm font-semibold text-slate-200 truncate group-hover:text-amber-300 transition-colors">
                    {match.awayTeam.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-slate-400">
                    Vár. gól {match.awayTeam.xgAvg}
                  </span>
                  {match.awayScore !== undefined && (
                    <span className="font-mono font-black text-sm text-amber-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                      {match.awayScore}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Gyors Hőtérkép Pills (1, X, 2, BTTS, O2.5) */}
            <div className="grid grid-cols-5 gap-1.5 text-center">
              <button
                type="button"
                onClick={(e) =>
                  onCellBet(
                    e,
                    match,
                    `${match.homeTeam.name} Győzelem (1)`,
                    p.homeWin,
                    match.odds.home,
                    '1'
                  )
                }
                className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                  getProbabilityColorClass(p.homeWin).bg
                } ${focusMarket === '1X2' ? 'ring-1 ring-amber-400' : ''}`}
                title={`Hazai: ${p.homeWin}% @${match.odds.home.toFixed(2)}`}
              >
                <span className="text-[9px] uppercase block opacity-75">1</span>
                <span>{p.homeWin}%</span>
              </button>

              <button
                type="button"
                onClick={(e) =>
                  onCellBet(e, match, 'Döntetlen (X)', p.draw, match.odds.draw, 'X')
                }
                className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                  getProbabilityColorClass(p.draw).bg
                } ${focusMarket === '1X2' ? 'ring-1 ring-amber-400' : ''}`}
                title={`Döntetlen: ${p.draw}% @${match.odds.draw.toFixed(2)}`}
              >
                <span className="text-[9px] uppercase block opacity-75">X</span>
                <span>{p.draw}%</span>
              </button>

              <button
                type="button"
                onClick={(e) =>
                  onCellBet(
                    e,
                    match,
                    `${match.awayTeam.name} Győzelem (2)`,
                    p.awayWin,
                    match.odds.away,
                    '2'
                  )
                }
                className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                  getProbabilityColorClass(p.awayWin).bg
                } ${focusMarket === '1X2' ? 'ring-1 ring-amber-400' : ''}`}
                title={`Vendég: ${p.awayWin}% @${match.odds.away.toFixed(2)}`}
              >
                <span className="text-[9px] uppercase block opacity-75">2</span>
                <span>{p.awayWin}%</span>
              </button>

              <button
                type="button"
                onClick={(e) =>
                  onCellBet(
                    e,
                    match,
                    'Mindkét csapat szerez gólt (BTTS)',
                    p.bttsYes,
                    match.odds.bttsYes,
                    'BTTS_YES'
                  )
                }
                className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                  getProbabilityColorClass(p.bttsYes).bg
                } ${focusMarket === 'BTTS' ? 'ring-1 ring-amber-400' : ''}`}
                title={`BTTS: ${p.bttsYes}% @${match.odds.bttsYes.toFixed(2)}`}
              >
                <span className="text-[9px] uppercase block opacity-75">BTTS</span>
                <span>{p.bttsYes}%</span>
              </button>

              <button
                type="button"
                onClick={(e) =>
                  onCellBet(e, match, '2.5 gól felett', p.over25, match.odds.over25, 'OVER_25')
                }
                className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                  getProbabilityColorClass(p.over25).bg
                } ${focusMarket === 'OVER_25' ? 'ring-1 ring-amber-400' : ''}`}
                title={`2.5 felett: ${p.over25}% @${match.odds.over25.toFixed(2)}`}
              >
                <span className="text-[9px] uppercase block opacity-75">&gt;2.5</span>
                <span>{p.over25}%</span>
              </button>
            </div>

            {/* 4. AI Ajánlott Tipp Sáv & Szelvény gomb */}
            {pick && (
              <div className="pt-2.5 border-t border-slate-800/70 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    MI Tipp:
                  </div>
                  <div className="text-xs sm:text-sm font-black text-amber-300 truncate">
                    {pick.marketLabel}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCellBet(e, match, pick.marketLabel, pick.probability, pick.odds, pick.market);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      isPickAdded
                        ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
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
