import React from 'react';
import { Radar } from 'lucide-react';
import type { LeagueRadarStat } from '../../services/scannerService';

/** Bajnokságok kvantitatív gól- és értékradara: várható gólátlag, Over 2.5 és BTTS esély ligánként. */
export const LeagueRadar: React.FC<{ stats: LeagueRadarStat[] }> = ({ stats }) => (
  <div className="space-y-4">
    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <Radar className="w-4 h-4 text-blue-400" />
        Bajnokságok Kvantitatív Gól- és Értékradara
      </span>
      <span className="text-[11px] text-slate-400">
        Rendezve a legmagasabb várható gólátlag (xG) szerint
      </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {stats.map((stat, idx) => (
        <div
          key={stat.leagueId}
          className="p-4 rounded-xl bg-mesh-dark border border-slate-800/80 hover:border-slate-700 space-y-3 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{stat.leagueFlag}</span>
              <div>
                <div className="font-extrabold text-sm text-white">{stat.leagueName}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {stat.leagueCountry} &bull; {stat.matchCount} meccs a kínálatban
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              #{idx + 1}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9px] text-slate-400 block font-bold">Várható xG</span>
              <span className="text-sm font-black text-amber-400 font-mono">
                {stat.avgExpectedGoals}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9px] text-slate-400 block font-bold">&gt; 2.5 Gól</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {stat.avgOver25Prob}%
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9px] text-slate-400 block font-bold">BTTS Esély</span>
              <span className="text-sm font-black text-teal-400 font-mono">
                {stat.avgBttsProb}%
              </span>
            </div>
          </div>

          {stat.topOver25Match && (
            <div className="text-[11px] p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-300 flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">Top gólvárakozás:</span>
              <span className="font-semibold truncate text-white ml-1">
                {stat.topOver25Match}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);
