import React, { useState } from 'react';
import { Sparkles, Award, Calendar, Layers, HelpCircle, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react';
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
  // Összecsukható KPI sáv állapota a szellősebb és tisztább felületért
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('soccerai_hero_kpi_collapsed') === 'true';
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('soccerai_hero_kpi_collapsed', String(next));
      }
      return next;
    });
  };

  // 1. Összecsukott nézet: Ultra-letisztult, szuper-vékony (28px) diszkrét sáv
  if (isCollapsed) {
    return (
      <section className="border-b border-slate-800/80 bg-mesh-dark py-1 w-full overflow-hidden transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none py-0.5">
            <span className="flex items-center gap-1 font-bold text-slate-300">
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span>Ma: <strong className="text-white">{matchCount} meccs</strong></span>
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">
              <strong className="text-white">{leagueCount}</strong> bajnokság
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-emerald-400 font-medium">
              <strong>{strongSignalCount}</strong> kiemelt jel
            </span>
          </div>

          <button
            onClick={toggleCollapse}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-amber-400 px-2 py-0.5 rounded-lg hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
            title="KPI sáv és hőtérkép kibontása"
          >
            <span>KPI sáv</span>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </section>
    );
  }

  // 2. Kinyitott nézet: Teljes funkciók + Összecsukás gomb
  return (
    <section className="border-b border-slate-800/80 bg-mesh-dark py-2.5 w-full overflow-hidden transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          
          {/* Bal oldal: 3D Animált Labda & Kompakt KPI Mutatók */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none touch-pan-x pb-0.5 lg:pb-0">
            {/* 3D Interaktív Forgó Labda Widget */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-mesh-card border border-slate-800 text-xs shrink-0 shadow-sm">
              <ThreeDBall size={28} showRings={true} interactive={true} />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  3D Motor
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Interaktív</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-mesh-card border border-slate-800 text-xs whitespace-nowrap shrink-0">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Ma:</span>
              <strong className="text-white font-extrabold">{matchCount} meccs</strong>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-mesh-card border border-slate-800 text-xs whitespace-nowrap shrink-0">
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
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-mesh-dark border border-slate-800 text-xs whitespace-nowrap shrink-0">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Tegnap:</span>
                <strong className="text-emerald-400 font-bold">
                  {yesterdayStat.won}/{yesterdayStat.total} ({yesterdayStat.winRate}%)
                </strong>
              </div>
            ) : (
              <div
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-mesh-dark border border-slate-800 text-xs whitespace-nowrap shrink-0"
                title="Kezdés előtt rögzített, megmásíthatatlan predikciónapló aktív"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Audit:</span>
                <strong className="text-emerald-300 font-semibold">Pre-Match Napló</strong>
              </div>
            )}
          </div>

          {/* Jobb oldal: Segédlet + Összecsukás gomb */}
          <div className="flex items-center justify-between lg:justify-end gap-2 text-[10px] font-semibold overflow-x-auto scrollbar-none touch-pan-x">
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

            {/* Összecsukás Gomb */}
            <button
              onClick={toggleCollapse}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer ml-1"
              title="KPI sáv összecsukása"
            >
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Elrejtés</span>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
