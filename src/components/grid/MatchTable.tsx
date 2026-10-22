import { isMatchLive } from '../../utils/matchStatus';
import React from 'react';
import { Match, BetSlipItem, FocusMarket } from '../../types/football';
import { getProbabilityColorClass } from '../../services/predictionEngine';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { CellBetHandler } from './types';

export interface MatchTableProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onCellBet: CellBetHandler;
  betSlipItems: BetSlipItem[];
  focusMarket: FocusMarket;
}

export const MatchTable: React.FC<MatchTableProps> = ({
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
            <th
              className={`py-3 px-2 text-center w-14 ${
                focusMarket === '1X2' ? 'text-amber-300 bg-amber-500/10 font-black' : ''
              }`}
            >
              1 (Hazai)
            </th>
            <th
              className={`py-3 px-2 text-center w-14 ${
                focusMarket === '1X2' ? 'text-amber-300 bg-amber-500/10 font-black' : ''
              }`}
            >
              X (Dönt.)
            </th>
            <th
              className={`py-3 px-2 text-center w-14 ${
                focusMarket === '1X2' ? 'text-amber-300 bg-amber-500/10 font-black' : ''
              }`}
            >
              2 (Vendég)
            </th>
            <th
              className={`py-3 px-2 text-center w-14 ${
                focusMarket === 'BTTS' ? 'text-amber-300 bg-amber-500/10 font-black' : ''
              }`}
            >
              BTTS (Gól mind2)
            </th>
            <th
              className={`py-3 px-2 text-center w-14 ${
                focusMarket === 'OVER_15' ? 'text-amber-300 bg-amber-500/10 font-black' : ''
              }`}
            >
              &gt; 1.5 Gól
            </th>
            <th
              className={`py-3 px-2 text-center w-14 ${
                focusMarket === 'OVER_25' ? 'text-amber-300 bg-amber-500/10 font-black' : ''
              }`}
            >
              &gt; 2.5 Gól
            </th>
            <th className="py-3 px-2 text-center w-14">&gt; 3.5 Gól</th>
            <th
              className={`py-3 px-2 text-center w-14 ${
                focusMarket === 'FH_OVER_05' ? 'text-amber-300 bg-amber-500/10 font-black' : ''
              }`}
            >
              1.F &gt; 0.5
            </th>
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
              (it) =>
                it.matchId === match.id &&
                (it.market === 'BTTS' || it.market === 'BTTS_YES' || it.marketLabel.includes('BTTS'))
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
                  ) : isMatchLive(match) ? (
                    <span className="inline-flex items-center gap-1 font-bold text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      ÉLŐ
                    </span>
                  ) : match.liveStale ? (
                    <span
                      className="font-bold text-[10px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-dashed border-slate-600"
                      title="A mérkőzés a kezdés óta eltelt idő alapján véget ért; a végeredményt a forrás még nem jelentette"
                    >
                      Lefújva · frissül
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
                  className={`btn-cell-3d py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 cursor-pointer ${cHome.bg} ${
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
                  className={`btn-cell-3d py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 cursor-pointer ${cDraw.bg} ${
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
                  className={`btn-cell-3d py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 cursor-pointer ${cAway.bg} ${
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
                    onCellBet(
                      e,
                      match,
                      'Mindkét csapat szerez gólt (BTTS)',
                      p.bttsYes,
                      match.odds.bttsYes,
                      'BTTS_YES'
                    )
                  }
                  className={`btn-cell-3d py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 cursor-pointer ${cBtts.bg} ${
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
                  className={`btn-cell-3d py-2 px-2 text-center rounded-lg transition-transform hover:scale-105 cursor-pointer ${cO25.bg} ${
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
