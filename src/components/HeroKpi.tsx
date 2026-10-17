import React from 'react';
import { Sparkles, TrendingUp, ShieldAlert, Award, Calendar } from 'lucide-react';

interface HeroKpiProps {
  matchCount: number;
  leagueCount: number;
  strongSignalCount: number;
  onExplorePicks: () => void;
}

export const HeroKpi: React.FC<HeroKpiProps> = ({
  matchCount,
  leagueCount,
  strongSignalCount,
  onExplorePicks,
}) => {
  return (
    <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#0A101F] via-[#080D1A] to-[#070B14] py-8 sm:py-12">
      {/* Decorative gradient glow background */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Bal oszlop: Fő üzenet */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Magyar nyelvű AI sportanalitika & valószínűségszámítás</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Mai meccsek esélyei.{' '}
              <span className="italic font-normal bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-300 bg-clip-text text-transparent">
                Minden kulcspiac egy képernyőn.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              Poisson- és xG gépi tanulási modell valószínűségek a legrangosabb európai bajnokságokra és a hazai NB I-re. 
              Színkódolt hőtérkép a kiugró statisztikai jelek és az alulárazott (Value Bet) szorzók azonnali felismeréséhez.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onExplorePicks}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Napi Top 3 Kiemelt AI Tipp megtekintése
              </button>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Tegnapi találati arány: <strong className="text-emerald-400">83%</strong> (5/4 zöldült)</span>
              </div>
            </div>
          </div>

          {/* Jobb oszlop: KPI kártyák és Jelmagyarázat */}
          <div className="lg:col-span-5 space-y-4">
            {/* KPI grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800 text-center hover:border-slate-700 transition-colors">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {matchCount}
                </div>
                <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                  Értékelt meccs ma
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800 text-center hover:border-slate-700 transition-colors">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {leagueCount}
                </div>
                <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                  Top Bajnokság
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0D1527] border border-emerald-500/40 text-center bg-gradient-to-b from-emerald-500/10 to-transparent">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
                  {strongSignalCount}
                </div>
                <div className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider mt-1">
                  Kiemelt jel (60%+)
                </div>
              </div>
            </div>

            {/* Színkód-skála magyarázat (Legend - footballtipster.ai stílus) */}
            <div className="p-3.5 rounded-xl bg-[#0D1527]/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium border-b border-slate-800/80 pb-1.5">
                <span>Modell valószínűségi hőtérkép:</span>
                <span className="text-[10px] text-amber-400 font-semibold">Minél zöldebb, annál valószínűbb</span>
              </div>
              
              <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-semibold">
                <div className="py-1 px-1 rounded bg-emerald-500/25 border border-emerald-500/40 text-emerald-300">
                  65%+
                  <span className="block text-[8px] font-normal text-emerald-400/80 opacity-80">Kiemelt</span>
                </div>
                <div className="py-1 px-1 rounded bg-teal-500/20 border border-teal-500/30 text-teal-300">
                  55-64%
                  <span className="block text-[8px] font-normal text-teal-400/80 opacity-80">Erős</span>
                </div>
                <div className="py-1 px-1 rounded bg-slate-700/40 border border-slate-600/40 text-slate-300">
                  45-54%
                  <span className="block text-[8px] font-normal text-slate-400 opacity-80">Közepes</span>
                </div>
                <div className="py-1 px-1 rounded bg-slate-800/60 border border-slate-800 text-slate-400">
                  35-44%
                  <span className="block text-[8px] font-normal text-slate-500 opacity-80">Mérsékelt</span>
                </div>
                <div className="py-1 px-1 rounded bg-slate-900/60 border border-slate-900 text-slate-600">
                  &lt;35%
                  <span className="block text-[8px] font-normal text-slate-600 opacity-80">Alacsony</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
