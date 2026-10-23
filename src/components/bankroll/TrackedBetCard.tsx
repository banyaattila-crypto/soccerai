import React from 'react';
import { CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import type { TrackedBet, TrackedBetStatus } from '../../types/football';

interface TrackedBetCardProps {
  bet: TrackedBet;
  onStatusChange: (betId: string, status: TrackedBetStatus) => void;
  onDelete: (betId: string) => void;
}

/** Egy követett szelvény kártyája: események, állapotváltó gombok, összesített odds, tét és realizált eredmény. */
export const TrackedBetCard: React.FC<TrackedBetCardProps> = ({ bet, onStatusChange, onDelete }) => {
  const isWon = bet.status === 'WON';
  const isLost = bet.status === 'LOST';
  const isPending = bet.status === 'PENDING';
  const isVoid = bet.status === 'VOID';

  return (
  <div
    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-mesh-card ${
      isWon
        ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/20'
        : isLost
        ? 'border-red-500/30'
        : isPending
        ? 'border-amber-500/30'
        : 'border-slate-800'
    }`}
  >
    {/* Szelvény Kártya Fejléc */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-xs font-bold text-slate-400">
          {new Date(bet.createdAt).toLocaleString('hu-HU', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <span className="text-slate-600">&bull;</span>
        <span className="text-[11px] text-slate-400 font-mono">
          {bet.items.length} esemény
        </span>

        {bet.notes && (
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 text-[11px] font-medium border border-slate-700">
            {bet.notes}
          </span>
        )}
      </div>

      {/* Státusz gombok és jelvény */}
      <div className="flex items-center gap-1.5 self-start sm:self-auto">
        {/* Állapotváltó gombok */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => onStatusChange(bet.id, 'WON')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
              isWon
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
            title="Megjelölés nyertesként"
          >
            Nyert
          </button>
          <button
            onClick={() => onStatusChange(bet.id, 'LOST')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
              isLost
                ? 'bg-red-500 text-white font-black'
                : 'text-slate-400 hover:text-red-400'
            }`}
            title="Megjelölés vesztesként"
          >
            Vesztett
          </button>
          <button
            onClick={() => onStatusChange(bet.id, 'PENDING')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
              isPending
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-amber-400'
            }`}
            title="Visszaállítás folyamatban lévőként"
          >
            Függő
          </button>
          <button
            onClick={() => onStatusChange(bet.id, 'VOID')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
              isVoid
                ? 'bg-slate-700 text-white font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Megjelölés visszajártként (Void)"
          >
            Void
          </button>
        </div>

        {/* Törlés gomb */}
        <button
          onClick={() => onDelete(bet.id)}
          className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
          title="Szelvény törlése"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    {/* Események listája a szelvényen */}
    <div className="py-3 space-y-2">
      {bet.items.map((item, idx) => (
        <div
          key={`${item.matchId}-${idx}`}
          className="flex items-center justify-between gap-3 text-xs p-2 rounded-xl bg-slate-900/60 border border-slate-800/60"
        >
          <div className="min-w-0">
            <span className="font-bold text-white block truncate">
              {item.matchTitle}
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-slate-400 text-[11px]">
              <span className="text-amber-300 font-semibold">{item.marketLabel}</span>
              <span>&bull;</span>
              <span>AI Esély: {item.probability}%</span>
              {item.homeScore !== undefined && item.awayScore !== undefined && (
                <>
                  <span>&bull;</span>
                  <span className="font-bold text-white bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                    Végeredmény: {item.homeScore} - {item.awayScore}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              @{item.odds.toFixed(2)}
            </span>
            {item.isWon === true && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            {item.isWon === false && (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>
      ))}
    </div>

    {/* Szelvény Kártya Lábléc (Odds, Tét, Kifizetés, Profit) */}
    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Összesített Odds
          </span>
          <span className="font-black text-amber-400 font-mono text-sm">
            {bet.totalOdds.toFixed(2)}
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Megtett Tét
          </span>
          <span className="font-bold text-white font-mono text-sm">
            {bet.stake.toLocaleString('hu-HU')} Ft
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            {isWon ? 'Realizált Kifizetés' : 'Várható Kifizetés'}
          </span>
          <span className="font-bold text-slate-200 font-mono text-sm">
            {bet.potentialWin.toLocaleString('hu-HU')} Ft
          </span>
        </div>
      </div>

      {/* Realizált Profit kijelző */}
      <div className="text-right">
        <span className="text-[10px] uppercase font-bold text-slate-400 block">
          Realizált Eredmény
        </span>
        {isWon && (
          <span className="text-sm font-black text-emerald-400 font-mono">
            +{(bet.potentialWin - bet.stake).toLocaleString('hu-HU')} Ft
          </span>
        )}
        {isLost && (
          <span className="text-sm font-black text-red-400 font-mono">
            -{bet.stake.toLocaleString('hu-HU')} Ft
          </span>
        )}
        {isPending && (
          <span className="text-xs font-bold text-amber-400 font-mono">
            Folyamatban...
          </span>
        )}
        {isVoid && (
          <span className="text-xs font-bold text-slate-400 font-mono">
            Tét visszajárt (0 Ft)
          </span>
        )}
      </div>
    </div>
  </div>
  );
};
