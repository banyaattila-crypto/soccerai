import React from 'react';
import type { FocusMarket } from '../../types/football';

interface ActiveFilterChipsProps {
  /** A kiválasztott liga azonosítója és neve; 'all' esetén nincs liga-chip */
  effectiveLeague: string;
  leagueName: string;
  onClearLeague: () => void;
  onlyStrongSignals: boolean;
  signalThreshold: number;
  onClearStrongSignals: () => void;
  onlyLiveMatches: boolean;
  onClearLiveMatches: () => void;
  focusMarket: FocusMarket;
  onClearMarket: () => void;
  searchQuery: string;
  onClearSearch: () => void;
  onResetAll: () => void;
}

const Chip: React.FC<{ tone: string; label: React.ReactNode; onClear: () => void }> = ({ tone, label, onClear }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-medium ${tone}`}>
    <span>{label}</span>
    <button onClick={onClear} className="hover:text-white ml-0.5 cursor-pointer">
      ✕
    </button>
  </span>
);

/** Aktív szűrők chipjei (a szűrőpanel csukott állapotában jelennek meg, ha van aktív szűrő). */
export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  effectiveLeague,
  leagueName,
  onClearLeague,
  onlyStrongSignals,
  signalThreshold,
  onClearStrongSignals,
  onlyLiveMatches,
  onClearLiveMatches,
  focusMarket,
  onClearMarket,
  searchQuery,
  onClearSearch,
  onResetAll,
}) => (
  <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs animate-fade-in">
    <span className="text-[11px] font-bold text-slate-400 mr-1">Aktív szűrők:</span>
    {effectiveLeague !== 'all' && (
      <Chip
        tone="bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
        label={`Liga: ${leagueName}`}
        onClear={onClearLeague}
      />
    )}
    {onlyStrongSignals && (
      <Chip
        tone="bg-amber-500/15 border-amber-500/30 text-amber-300"
        label={`Kiemelt (${signalThreshold}%+)`}
        onClear={onClearStrongSignals}
      />
    )}
    {onlyLiveMatches && (
      <Chip tone="bg-red-500/15 border-red-500/30 text-red-300" label="Csak Élő" onClear={onClearLiveMatches} />
    )}
    {focusMarket !== 'ALL' && (
      <Chip
        tone="bg-blue-500/15 border-blue-500/30 text-blue-300"
        label={`Piac: ${focusMarket}`}
        onClear={onClearMarket}
      />
    )}
    {searchQuery && (
      <Chip
        tone="bg-slate-800 border-slate-700 text-slate-300"
        label={<>Keresés: &bdquo;{searchQuery}&ldquo;</>}
        onClear={onClearSearch}
      />
    )}
    <button onClick={onResetAll} className="text-[11px] text-amber-400 hover:underline font-semibold ml-1 cursor-pointer">
      Összes törlése
    </button>
  </div>
);
