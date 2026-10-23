import React from 'react';
import type { MarketCategory } from '../../services/betEvaluation';

export interface MarketBreakdownRow {
  id: MarketCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  total: number;
  won: number;
  winRate: number;
  profit: number;
  roi: number;
}

interface MarketBreakdownProps {
  rows: MarketBreakdownRow[];
  activeMarket: MarketCategory;
  onSelect: (market: MarketCategory) => void;
}

/** Piaconkénti hitelesített teljesítmény; a kártyára kattintva a lista az adott piacra szűkül. */
export const MarketBreakdown: React.FC<MarketBreakdownProps> = ({ rows, activeMarket, onSelect }) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
      <span className="uppercase tracking-wider text-[11px] font-bold text-slate-300">
        Hitelesített Piaconkénti Teljesítmény (Kattints a szűréshez)
      </span>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {rows.map((mb) => {
        const Icon = mb.icon;
        const isSelected = activeMarket === mb.id;
        return (
          <button
            key={mb.id}
            onClick={() => onSelect(isSelected ? 'ALL' : mb.id)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              isSelected
                ? 'bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950 border-amber-400 shadow-md shadow-amber-500/10 scale-[1.02]'
                : 'bg-mesh-dark hover:border-slate-700 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Icon className={`w-3.5 h-3.5 ${mb.color}`} />
                <span className="truncate">{mb.label}</span>
              </span>
              {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-white">{mb.total > 0 ? `${mb.winRate}%` : '—'}</span>
                <span className="text-[11px] font-mono text-slate-400">
                  {mb.won}/{mb.total} nyert
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                <span className="text-slate-500">Audit ROI:</span>
                <span className={`font-mono font-bold ${mb.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {mb.total > 0 ? `${mb.roi >= 0 ? '+' : ''}${mb.roi}%` : '—'}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);
