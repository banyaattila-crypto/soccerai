import React from 'react';
import { Plus, Check, Eye, Calendar, Clock } from 'lucide-react';
import type { Match, BetSlipItem } from '../../types/football';
import type { ScannedOpportunity } from '../../services/scannerService';
import { MarketGapChip } from '../MarketGapChip';

interface OpportunityCardProps {
  opp: ScannedOpportunity;
  isAdded: boolean;
  onSelectMatch: (match: Match) => void;
  onAddToBetSlip: (item: BetSlipItem) => void;
}

/** Egy szkennelt fogadási lehetőség sora: meccs, piac, esély, szorzó, várható él és a műveleti gombok. */
export const OpportunityCard: React.FC<OpportunityCardProps> = ({ opp, isAdded, onSelectMatch, onAddToBetSlip }) => {
  const isPositiveEv = opp.expectedValue > 0;

  return (
  <div
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
        {opp.isRealOdds ? (
          opp.isExpired ? (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30">
              🔴 Lejárt odds
            </span>
          ) : (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <span>🏢 {opp.bookmakerName || 'Bukméker'}</span>
              {opp.ttlMinutes !== undefined && (
                <span className="text-blue-400 font-mono">⏳ {opp.ttlMinutes}p</span>
              )}
            </span>
          )
        ) : (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            🧪 Szimulált ár
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

      <MarketGapChip match={opp.match} compact />

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

      {/* Várható érték (+EV) és Kelly */}
      {opp.isRealOdds && !opp.isExpired ? (
        <div
          className={`p-2 rounded-lg border text-center min-w-[75px] ${
            isPositiveEv
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          <span className="text-[9px] uppercase block font-bold">Várható Él</span>
          <span className="text-xs font-black font-mono">
            {opp.expectedValue > 0 ? `+${opp.expectedValue}%` : `${opp.expectedValue}%`}
          </span>
          {opp.quarterKellyPct > 0 && (
            <span className="text-[8px] text-amber-300 block font-mono">
              ¼-K: {opp.quarterKellyPct}%
            </span>
          )}
        </div>
      ) : opp.isExpired ? (
        <div className="p-2 rounded-lg bg-red-950/30 border border-red-800/40 text-red-400 text-center min-w-[75px]">
          <span className="text-[9px] uppercase block font-bold">Lejárt</span>
          <span className="text-[10px] font-black font-mono text-red-300">Letiltva</span>
          <span className="text-[8px] text-red-400/80 block">Frissítés kell</span>
        </div>
      ) : (
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-center min-w-[75px]">
          <span className="text-[9px] uppercase block font-bold text-slate-500">Érték (+EV)</span>
          <span className="text-[10px] font-bold font-mono text-slate-400">Letiltva</span>
          <span className="text-[8px] text-slate-500 block">Szimulált ár</span>
        </div>
      )}
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
            isRealOdds: opp.isRealOdds && !opp.isExpired,
            isSimulatedOdds: !opp.isRealOdds,
            bookmakerName: opp.bookmakerName,
            oddsExpiresAt: opp.expiresAt,
            isExpired: opp.isExpired,
            matchStatus: opp.match.status,
            kickoffDate: opp.match.kickoffDate,
            kickoffTime: opp.match.kickoffTime,
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
};
