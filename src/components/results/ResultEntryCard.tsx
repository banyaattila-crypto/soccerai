import React from 'react';
import { ShieldCheck, Clock, CheckCircle2, XCircle, Lock } from 'lucide-react';
import type { UnifiedResultEntry } from '../ResultsView';

interface ResultEntryCardProps {
  entry: UnifiedResultEntry;
  onClick: () => void;
}

/** Egy lezárt vagy függő mérkőzés kártyája az Eredmények & Audit nézetben (audit-jelvény, eredmény, MI tipp). */
export const ResultEntryCard: React.FC<ResultEntryCardProps> = ({ entry, onClick }) => {
  const isWon = entry.status === 'WON';
  const isLost = entry.status === 'LOST';
  const isPending = !entry.settled;
  const isVerified = entry.type === 'verified';

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-2xl bg-mesh-card border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-md group"
    >
      {/* Felső fejléc: Liga + Audit/Archívum címke + Státusz */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate max-w-[55%]">
            <span>{entry.leagueFlag || '⚽'}</span>
            <span className="truncate">{entry.leagueName}</span>
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Audit jelvény */}
            {isVerified ? (
              <span className="font-mono text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" /> AUDITÁLT
              </span>
            ) : (
              <span className="font-mono text-[9px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                ARCHÍVUM
              </span>
            )}

            {/* Találati státusz címke */}
            {isPending ? (
              <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> FÜGGŐBEN
              </span>
            ) : isWon ? (
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> NYERTES
              </span>
            ) : isLost ? (
              <span className="font-mono text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                <XCircle className="w-2.5 h-2.5" /> VESZTES
              </span>
            ) : (
              <span className="font-mono text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                LEFÚJVA
              </span>
            )}
          </div>
        </div>

        {/* Időpont & ellenőrző összeg */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
          <span className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            <span>{entry.kickoffDate} {entry.kickoffTime}</span>
          </span>
          {entry.auditHash && (
            <span className="text-emerald-400/80 truncate max-w-[120px]" title={`Ellenőrző összeg (sérülést jelez, nem hamisítás-biztos): ${entry.auditHash}`}>
              <Lock className="w-2.5 h-2.5 inline mr-0.5 text-emerald-400" />
              {entry.auditHash}
            </span>
          )}
        </div>
      </div>

      {/* Csapatok és Eredmény */}
      <div className="py-2.5 flex items-center justify-between border-y border-slate-800/80">
        <div className="space-y-1.5 min-w-0 pr-2 flex-1">
          <div className="flex items-center gap-2">
            {entry.homeTeam.logo && (
              <img src={entry.homeTeam.logo} alt="" className="w-4 h-4 object-contain shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
              {entry.homeTeam.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {entry.awayTeam.logo && (
              <img src={entry.awayTeam.logo} alt="" className="w-4 h-4 object-contain shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium text-slate-300 truncate group-hover:text-amber-300 transition-colors">
              {entry.awayTeam.name}
            </span>
          </div>
        </div>

        <div className="text-right font-mono font-black text-lg text-amber-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
          {entry.settled && typeof entry.homeScore === 'number' ? (
            <>
              <div>{entry.homeScore}</div>
              <div>{entry.awayScore}</div>
            </>
          ) : (
            <span className="text-xs text-slate-500 font-sans">vs</span>
          )}
        </div>
      </div>

      {/* MI Tipp Doboz */}
      {entry.pickLabel && (
        <div className="space-y-1.5">
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
              isPending
                ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                : isWon
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : isLost
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}
          >
            <div className="min-w-0 pr-2">
              <span className="text-[9px] uppercase font-bold block opacity-75">
                {isPending ? 'PRE-MATCH MI TIPP' : isWon ? 'TALÁLAT' : isLost ? 'NEM JÖTT BE' : 'MI TIPP'}
              </span>
              <span className="font-extrabold truncate block text-white">
                {entry.pickLabel}
              </span>
            </div>

            <div className="text-right shrink-0">
              {entry.pickOdds && (
                <span className="font-mono font-bold text-xs bg-slate-950 px-2 py-0.5 rounded text-white border border-slate-800 block">
                  @{entry.pickOdds.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Profit / ROI vagy Státusz */}
          {entry.profit !== undefined && (
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span>{isPending ? 'Státusz:' : 'Kalkulált egyenleg:'}</span>
              <span
                className={`font-mono font-bold ${
                  isPending
                    ? 'text-amber-400'
                    : isWon
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {isPending
                  ? 'Kezdésre / Lefújásra vár'
                  : isWon
                  ? `+${entry.profit.toLocaleString('hu-HU')} Ft`
                  : `${entry.profit.toLocaleString('hu-HU')} Ft`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Indoklás */}
      {entry.reasoning && (
        <p className="text-[11px] text-slate-400 italic line-clamp-2 pt-1 border-t border-slate-800/60">
          &bdquo;{entry.reasoning}&ldquo;
        </p>
      )}
    </div>
  );
};
