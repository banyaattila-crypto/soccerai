import React from 'react';
import { Sparkles, Award, Calendar, Layers, HelpCircle } from 'lucide-react';
import { ThreeDBall } from './ThreeDBall';

interface HeroKpiProps {
  matchCount: number;
  leagueCount: number;
  strongSignalCount: number;
  yesterdayStat?: { won: number; total: number; winRate: number } | null;
  onExplorePicks?: () => void;
  onOpenMethodology?: () => void;
}

export const HeroKpi: React.FC<HeroKpiProps> = ({
  matchCount,
  leagueCount,
  strongSignalCount,
  yesterdayStat,
  onOpenMethodology,
}) => {
  return (
    <section className="border-b border-slate-800/80 bg-[#0A101F]/95 py-2.5 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          
          {/* Bal oldal: 3D Animált Labda & Kompakt KPI Mutatók */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none touch-pan-x pb-0.5 lg:pb-0">
            {/* 3D Interaktív Forgó Labda Widget */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#0D1527] border border-slate-800 text-xs shrink-0 shadow-sm">
              <ThreeDBall size={28} showRings={true} interactive={true} />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  3D Motor
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Interaktív</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0D1527] border border-slate-800 text-xs whitespace-nowrap shrink-0">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Ma:</span>
              <strong className="text-white font-extrabold">{matchCount} meccs</strong>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0D1527] border border-slate-800 text-xs whitespace-nowrap shrink-0">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <strong className="text-white font-extrabold">{leagueCount}</strong>
              <span className="text-slate-400">bajnokság</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs whitespace-nowrap shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <strong className="text-emerald-300 font-extrabold">{strongSignalCount}</strong>
              <span className="text-emerald-300/90 font-medium">kiemelt jel (60%+)</span>
            </div>

            {yesterdayStat && yesterdayStat.total > 0 ? (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs whitespace-nowrap shrink-0">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Tegnap:</span>
                <strong className="text-emerald-400 font-bold">
                  {yesterdayStat.won}/{yesterdayStat.total} ({yesterdayStat.winRate}%)
                </strong>
              </div>
            ) : (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs whitespace-nowrap shrink-0">
                <Award className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-400">Modell:</span>
                <strong className="text-sky-300 font-semibold">Dixon–Coles</strong>
              </div>
            )}
          </div>

          {/* Jobb oldal: Egysoros Kompakt Hőtérkép Színskála */}
          <div className="flex items-center justify-between lg:justify-end gap-2 text-[10px] font-semibold overflow-x-auto scrollbar-none touch-pan-x">
            <span className="text-slate-400 whitespace-nowrap hidden xl:inline mr-1">
              Hőtérkép skála:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 whitespace-nowrap">
                65%+ Kiemelt
              </span>
              <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/30 text-teal-300 whitespace-nowrap">
                55-64% Erős
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-700/40 border border-slate-600/40 text-slate-300 whitespace-nowrap">
                45-54% Közepes
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800/70 border border-slate-800 text-slate-400 whitespace-nowrap hidden sm:inline-block">
                &lt;45% Alacsony
              </span>
            </div>

            {onOpenMethodology && (
              <button
                onClick={onOpenMethodology}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Kvantitatív módszertan és jelmagyarázat"
              >
                <HelpCircle className="w-3 h-3 text-emerald-400" />
                <span>Segédlet</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
