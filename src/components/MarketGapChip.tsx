import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Match } from '../types/football';
import { getMarketGap } from '../utils/marketGap';

interface MarketGapChipProps {
  match: Pick<Match, 'probabilities' | 'modelProbabilities' | 'probabilitySource'>;
  /** Kompakt megjelenés (sorokba, kártyák fejlécébe): külső margó nélkül */
  compact?: boolean;
}

/** "Modell ≠ piac" jelző: csak ott jelenik meg, ahol a modell és a piaci ár érdemben eltér (backtest-alapú küszöb). */
export const MarketGapChip: React.FC<MarketGapChipProps> = ({ match, compact }) => {
  const gap = getMarketGap(match);
  if (!gap || gap.level === 'none') return null;
  const strong = gap.level === 'strong';
  return (
    <span
      title={gap.tooltip}
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
        compact ? '' : 'mt-2'
      } ${
        strong
          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      }`}
    >
      <AlertTriangle className="w-3 h-3 shrink-0" />
      <span>{gap.label}</span>
    </span>
  );
};
