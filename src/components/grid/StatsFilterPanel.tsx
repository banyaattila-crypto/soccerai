import React, { useRef, useState } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Layers,
  Target,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import type { FocusMarket } from '../../types/football';
import { GRID_METRICS, type GridMetricId, type GridMetricOption } from './types';

export interface FilterLeagueOption {
  id: string;
  name: string;
  flag: string;
  count: number;
}

const MARKET_OPTIONS: { id: FocusMarket; label: string }[] = [
  { id: 'ALL', label: 'Mind' },
  { id: 'OVER_25', label: 'O/U 2.5' },
  { id: 'BTTS', label: 'BTTS' },
  { id: '1X2', label: '1X2' },
  { id: 'FH_OVER_05', label: '1.F >0.5' },
  { id: 'OVER_15', label: '>1.5' },
];

// A Tailwind csak a teljes, literál osztálynevet ismeri fel, ezért a színváltozatok előre ki vannak írva
const METRIC_ACCENTS = {
  emerald: {
    open: 'bg-brand-500/20 text-brand-300 border-brand-400 shadow-sm',
    badge: 'bg-brand-500/20 text-brand-300',
    chevron: 'rotate-180 text-brand-400',
    selected: 'bg-brand-500/20 text-brand-300 font-bold',
    check: 'text-brand-400',
  },
  amber: {
    open: 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-sm',
    badge: 'bg-amber-500/20 text-amber-300',
    chevron: 'rotate-180 text-amber-400',
    selected: 'bg-amber-500/20 text-amber-300 font-bold',
    check: 'text-amber-400',
  },
} as const;

interface MetricDropdownProps {
  slot: 1 | 2;
  accent: keyof typeof METRIC_ACCENTS;
  align: 'left' | 'right';
  selectedId: GridMetricId;
  selectedLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (id: GridMetricId) => void;
}

/** Egy statisztikai mutató választó legördülő (a kompakt lista két oszlopához). */
const MetricDropdown: React.FC<MetricDropdownProps> = ({
  slot,
  accent,
  align,
  selectedId,
  selectedLabel,
  isOpen,
  onToggle,
  onSelect,
}) => {
  const c = METRIC_ACCENTS[accent];
  return (
    <div className="relative flex-1 sm:flex-initial">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border transition-all cursor-pointer z-30 relative ${
          isOpen ? c.open : 'bg-slate-900 text-slate-200 hover:text-white border-slate-700 hover:border-slate-600'
        }`}
        title={`${slot}. statisztikai mutató megváltoztatása`}
      >
        <span className={`w-4 h-4 rounded-full ${c.badge} text-[10px] flex items-center justify-center font-black shrink-0`}>
          {slot}.
        </span>
        <span className="font-mono">{selectedLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${isOpen ? c.chevron : 'text-slate-400'}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-1.5 w-60 p-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-30 space-y-0.5 max-h-72 overflow-y-auto`}
        >
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
            {slot}. Mutató kiválasztása
          </div>
          {GRID_METRICS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer ${
                selectedId === opt.id ? c.selected : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{opt.label}</span>
              {selectedId === opt.id && <Check className={`w-3.5 h-3.5 ${c.check}`} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface StatsFilterPanelProps {
  availableLeagues: FilterLeagueOption[];
  effectiveLeague: string;
  dayMatchCount: number;
  isLeaguesExpanded: boolean;
  onToggleLeaguesExpanded: () => void;
  onSelectLeague: (leagueId: string) => void;
  onlyStrongSignals: boolean;
  onToggleStrongSignals: () => void;
  signalThreshold: number;
  onlyLiveMatches: boolean;
  onToggleLiveMatches: () => void;
  liveMatchesCount: number;
  showCollapseAll: boolean;
  allCollapsed: boolean;
  onToggleAllLeagues: () => void;
  focusMarket: FocusMarket;
  onFocusMarketChange: (market: FocusMarket) => void;
  metric1: GridMetricId;
  metric2: GridMetricId;
  metricOption1: GridMetricOption;
  metricOption2: GridMetricOption;
  onMetric1Change: (id: GridMetricId) => void;
  onMetric2Change: (id: GridMetricId) => void;
  onClose: () => void;
}

/** A Mérkőzés fül kinyíló részletes szűrőpanelje (bajnokságok, gyorskapcsolók, piac, mutatók). */
export const StatsFilterPanel: React.FC<StatsFilterPanelProps> = ({
  availableLeagues,
  effectiveLeague,
  dayMatchCount,
  isLeaguesExpanded,
  onToggleLeaguesExpanded,
  onSelectLeague,
  onlyStrongSignals,
  onToggleStrongSignals,
  signalThreshold,
  onlyLiveMatches,
  onToggleLiveMatches,
  liveMatchesCount,
  showCollapseAll,
  allCollapsed,
  onToggleAllLeagues,
  focusMarket,
  onFocusMarketChange,
  metric1,
  metric2,
  metricOption1,
  metricOption2,
  onMetric1Change,
  onMetric2Change,
  onClose,
}) => {
  const leaguesScrollRef = useRef<HTMLDivElement>(null);
  const [openMetricDropdown, setOpenMetricDropdown] = useState<1 | 2 | null>(null);

  const scrollLeagues = (direction: 'left' | 'right') => {
    leaguesScrollRef.current?.scrollBy({
      left: direction === 'left' ? -240 : 240,
      behavior: 'smooth',
    });
  };

  const leagueButtonClass = (active: boolean, extra: string, idle: string) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${extra} transition-all cursor-pointer ${
      active
        ? 'bg-brand-600 text-white font-extrabold shadow-md shadow-brand-600/30 border border-brand-500/50'
        : idle
    }`;

  return (
    <div className="p-4 rounded-2xl bg-mesh-card border border-slate-800 shadow-xl mb-5 space-y-4 animate-fade-in">
      {/* 1. Rész: Bajnokságok kiválasztása */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Bajnokságok ({availableLeagues.length})</span>
          </span>
          <button
            onClick={onToggleLeaguesExpanded}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            title={isLeaguesExpanded ? 'Egy soros görgethető nézet' : 'Összes liga kibontása több sorba'}
          >
            {isLeaguesExpanded ? (
              <>
                <ChevronUp className="w-3 h-3 text-brand-400" />
                <span>Összecsukás (1 sor)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 text-brand-400" />
                <span>Összes liga kibontása ({availableLeagues.length})</span>
              </>
            )}
          </button>
        </div>

        {/* Teljes szélességű Liga választó görgetőgombokkal */}
        <div className="relative w-full">
          {!isLeaguesExpanded && (
            <>
              <button
                onClick={() => scrollLeagues('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg bg-slate-900/95 text-slate-300 hover:text-white border border-slate-700 shadow-lg cursor-pointer hidden md:flex items-center justify-center"
                title="Görgetés balra"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollLeagues('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg bg-slate-900/95 text-slate-300 hover:text-white border border-slate-700 shadow-lg cursor-pointer hidden md:flex items-center justify-center"
                title="Görgetés jobbra"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          <div
            ref={leaguesScrollRef}
            className={`w-full py-1 ${
              isLeaguesExpanded
                ? 'flex flex-wrap gap-1.5'
                : 'flex items-center gap-1.5 overflow-x-auto scroll-smooth md:px-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent touch-pan-x'
            }`}
          >
            <button
              onClick={() => onSelectLeague('all')}
              className={leagueButtonClass(
                effectiveLeague === 'all',
                '',
                'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              )}
            >
              Minden Bajnokság ({dayMatchCount})
            </button>

            {availableLeagues.map((l) => (
              <button
                key={l.id}
                onClick={() => onSelectLeague(l.id)}
                className={leagueButtonClass(
                  effectiveLeague === l.id,
                  'flex items-center gap-1.5',
                  'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                )}
              >
                <span>{l.flag}</span>
                <span>{l.name}</span>
                <span
                  className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                    effectiveLeague === l.id ? 'bg-black/30 text-brand-200' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {l.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Rész: Gyorskapcsolók & Piac szűrés */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onToggleStrongSignals}
            className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              onlyStrongSignals
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Kiemelt Jelek ({signalThreshold}%+)</span>
          </button>

          <button
            type="button"
            onClick={onToggleLiveMatches}
            className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              onlyLiveMatches
                ? 'bg-red-500/25 text-red-200 border border-red-500/60 shadow-sm'
                : liveMatchesCount > 0
                ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {liveMatchesCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${liveMatchesCount > 0 ? 'bg-red-500' : 'bg-slate-500'}`}
              ></span>
            </span>
            <span>Csak Élő ({liveMatchesCount})</span>
          </button>

          {showCollapseAll && (
            <button
              onClick={onToggleAllLeagues}
              className="px-2.5 py-1.5 rounded-lg font-medium bg-slate-900 text-amber-300 hover:text-amber-200 border border-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              <span>{allCollapsed ? 'Összes kinyitása' : 'Összes becsukása'}</span>
            </button>
          )}
        </div>

        {/* Piacválasztó */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none touch-pan-x">
          <span className="text-[11px] font-bold text-amber-400 whitespace-nowrap flex items-center gap-1 mr-1">
            <Target className="w-3.5 h-3.5" />
            Piac:
          </span>
          {MARKET_OPTIONS.map((mkt) => (
            <button
              key={mkt.id}
              onClick={() => onFocusMarketChange(mkt.id)}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap text-xs transition-all cursor-pointer ${
                focusMarket === mkt.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {mkt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Rész: ScoreLab Dinamikus 2-Mutató Sáv */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="text-xs font-bold text-white">Kompakt Listán Megjelenített 2 Statisztikai Mutató:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap relative">
          {openMetricDropdown && (
            <div className="fixed inset-0 z-20 cursor-default" onClick={() => setOpenMetricDropdown(null)} />
          )}

          <MetricDropdown
            slot={1}
            accent="emerald"
            align="left"
            selectedId={metric1}
            selectedLabel={metricOption1.label}
            isOpen={openMetricDropdown === 1}
            onToggle={() => setOpenMetricDropdown(openMetricDropdown === 1 ? null : 1)}
            onSelect={(id) => {
              onMetric1Change(id);
              setOpenMetricDropdown(null);
            }}
          />
          <MetricDropdown
            slot={2}
            accent="amber"
            align="right"
            selectedId={metric2}
            selectedLabel={metricOption2.label}
            isOpen={openMetricDropdown === 2}
            onToggle={() => setOpenMetricDropdown(openMetricDropdown === 2 ? null : 2)}
            onSelect={(id) => {
              onMetric2Change(id);
              setOpenMetricDropdown(null);
            }}
          />
        </div>
      </div>

      {/* Szűrők összecsukása gomb a panel alján */}
      <div className="pt-2 flex justify-center border-t border-slate-800/60">
        <button
          onClick={onClose}
          className="text-xs font-semibold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>Szűrők összecsukása</span>
        </button>
      </div>
    </div>
  );
};
