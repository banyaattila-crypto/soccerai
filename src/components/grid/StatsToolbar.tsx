import React from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Layers,
  Table,
  LayoutGrid,
  List,
  X,
  RotateCcw,
} from 'lucide-react';
import type { ViewMode } from '../../types/football';
import type { DisplayMode } from './types';

interface StatsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isFiltersExpanded: boolean;
  activeFilterCount: number;
  onToggleFilters: () => void;
  onResetFilters: () => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
}

const DISPLAY_MODES: { mode: DisplayMode; label: string; title: string; Icon: typeof List }[] = [
  { mode: 'compact', label: 'Kompakt', title: 'ScoreLab kompakt meccssoros nézet', Icon: List },
  { mode: 'cards', label: 'Kártyák', title: 'Kártyás nézet', Icon: LayoutGrid },
  { mode: 'table', label: 'Táblázat', title: 'Részletes táblázat nézet', Icon: Table },
];

/** Kompakt eszköztár: gyorskereső, szűrők lenyitása, csoportosítás és a Kompakt / Kártyák / Táblázat váltó. */
export const StatsToolbar: React.FC<StatsToolbarProps> = ({
  searchQuery,
  onSearchChange,
  isFiltersExpanded,
  activeFilterCount,
  onToggleFilters,
  onResetFilters,
  viewMode,
  onToggleViewMode,
  displayMode,
  onDisplayModeChange,
}) => (
  <div className="p-3 sm:p-3.5 rounded-2xl bg-mesh-card border border-slate-800/90 mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
    {/* Bal oldal: Gyorskereső */}
    <div className="relative flex-1 max-w-md">
      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Csapat vagy bajnokság keresése..."
        className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
          title="Keresés törlése"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>

    {/* Jobb oldal: Szűrők lenyitó gomb + Csoportosítás + Nézetváltó */}
    <div className="flex flex-wrap items-center gap-2">
      {/* SZŰRŐK LENYITÓ GOMB (Badge-el és állapottal) */}
      <button
        onClick={onToggleFilters}
        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
          isFiltersExpanded || activeFilterCount > 0
            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
            : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
        }`}
        title={isFiltersExpanded ? 'Szűrők összecsukása' : 'Részletes szűrők és mutatók megnyitása'}
      >
        <Filter className="w-3.5 h-3.5 text-amber-400" />
        <span>Szűrők</span>
        {activeFilterCount > 0 && (
          <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-black text-[10px]">
            {activeFilterCount}
          </span>
        )}
        {isFiltersExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
        )}
      </button>

      {/* Szűrők törlése gomb, ha van aktív szűrő */}
      {activeFilterCount > 0 && (
        <button
          onClick={onResetFilters}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
          title="Minden szűrő alaphelyzetbe"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Csoportosítás váltó (Bajnokság szerint / Időrendben) */}
      <button
        onClick={onToggleViewMode}
        className="px-2.5 py-1.5 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
        title={viewMode === 'league' ? 'Váltás időrendi listára' : 'Váltás bajnokságonkénti csoportosításra'}
      >
        <Layers className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">{viewMode === 'league' ? 'Bajnokság szerint' : 'Időrendben'}</span>
      </button>

      {/* Kompakt / Kártyák / Táblázat nézetváltó */}
      <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-xl border border-slate-700/80">
        {DISPLAY_MODES.map(({ mode, label, title, Icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onDisplayModeChange(mode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              displayMode === mode ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title={title}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);
