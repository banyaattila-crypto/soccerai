import React from 'react';
import { ShieldCheck, TrendingUp } from 'lucide-react';
import type { VerifiedAuditStats } from '../../types/football';

interface AuditKpiGridProps {
  verifiedStats: VerifiedAuditStats;
}

/** A hitelesített (pre-match naplózott) tippek fő mutatói: találati arány, ROI, nettó profit, átlagos nyertes odds. */
export const AuditKpiGrid: React.FC<AuditKpiGridProps> = ({ verifiedStats }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
    {/* Találati Arány */}
    <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
      <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        Hitelesített Találati Arány
      </span>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-2xl sm:text-3xl font-black text-emerald-400">
          {verifiedStats.settledCount > 0 ? `${verifiedStats.winRate}%` : '—'}
        </span>
        {verifiedStats.settledCount > 0 && (
          <span className="text-xs text-slate-400 font-mono">
            ({verifiedStats.wonCount}/{verifiedStats.settledCount})
          </span>
        )}
      </div>
      <span className="text-[10px] text-slate-500 mt-1 block">
        {verifiedStats.pendingCount > 0
          ? `${verifiedStats.pendingCount} mérkőzés kezdésre/lefújásra vár`
          : 'Kizárólag lezárt pre-match tippekből'}
      </span>
    </div>

    {/* Hitelesített ROI */}
    <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
      <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        Kalibrációs ROI % (szimulált szorzón)
      </span>
      <div className="flex items-baseline gap-2 mt-2">
        <span
          className={`text-2xl sm:text-3xl font-black ${
            verifiedStats.settledCount === 0 ? 'text-slate-500' : 'text-slate-200'
          }`}
        >
          {verifiedStats.settledCount > 0
            ? `${verifiedStats.roi >= 0 ? '+' : ''}${verifiedStats.roi}%`
            : '—'}
        </span>
      </div>
      <span className="text-[10px] text-slate-500 mt-1 block">
        {verifiedStats.settledCount > 0
          ? `${(verifiedStats.totalStaked / 1000).toFixed(0)}e Ft össztétre; a szorzó többnyire a modellből képzett (5% árrés): kalibrációs mutató, nem piaci hozam`
          : 'Csak lezárt pre-match auditból'}
      </span>
    </div>

    {/* Hitelesített Profit */}
    <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
      <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">
        Szimulált Nettó Profit (nem valós pénz)
      </span>
      <div className="flex items-baseline gap-2 mt-2">
        <span
          className={`text-2xl sm:text-3xl font-black font-mono ${
            verifiedStats.settledCount === 0 ? 'text-slate-500' : 'text-slate-200'
          }`}
        >
          {verifiedStats.settledCount > 0
            ? `${verifiedStats.netProfit >= 0 ? '+' : ''}${verifiedStats.netProfit.toLocaleString('hu-HU')} Ft`
            : '—'}
        </span>
      </div>
      <span className="text-[10px] text-slate-500 mt-1 block">
        {verifiedStats.settledCount > 0
          ? '10 000 Ft alaptét / tipp'
          : '10 000 Ft egységtét alapon'}
      </span>
    </div>

    {/* Átlagos nyertes odds */}
    <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
      <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">
        Átlagos Nyertes Odds
      </span>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
          {verifiedStats.avgWinningOdds > 0 ? `@${verifiedStats.avgWinningOdds.toFixed(2)}` : '—'}
        </span>
      </div>
      <span className="text-[10px] text-slate-500 mt-1 block">
        Kizárólag igazolt nyertes tippekből
      </span>
    </div>
  </div>
);
