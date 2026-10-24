import React from 'react';
import { Scale } from 'lucide-react';
import type { ProtocolBetStats } from '../../services/protocolBets';

interface ProtocolBetsCardProps {
  stats: ProtocolBetStats;
}

const sign = (x: number, d = 1) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;

/**
 * A protokoll-tippekre kötött valós fogadások mérése: a ténylegesen kapott ár a naplózott (papír) árhoz képest,
 * a valós és a papír hozam ugyanazokon a tippeken, és irodánkénti bontás.
 */
export const ProtocolBetsCard: React.FC<ProtocolBetsCardProps> = ({ stats }) => {
  if (stats.n === 0) {
    return (
      <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800">
        <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
          <Scale className="w-3.5 h-3.5 text-brand-400" />
          Protokoll-fogadások: valós ár a papír árhoz képest
        </span>
        <p className="text-xs text-slate-400 mt-2">
          Még nincs protokoll-tippre kötött fogadás. A Napi Top Tippek oldalon a protokoll-tippek mellett a
          "Megfogadtam" gombbal rögzítheted az irodát, a kapott szorzót és a tétet. Így itt látszik, mennyit ér a valós
          ár a naplózotthoz képest, és melyik irodánál mekkora az eltérés.
        </p>
      </div>
    );
  }

  const slipTone = stats.avgSlippagePct < -1 ? 'text-red-300' : stats.avgSlippagePct < 0 ? 'text-amber-300' : 'text-white';
  return (
    <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800">
      <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
        <Scale className="w-3.5 h-3.5 text-brand-400" />
        Protokoll-fogadások: valós ár a papír árhoz képest
      </span>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
        <Metric label="Fogadások" value={String(stats.n)} sub={`${stats.settled} lezárt, ${stats.pending} függő`} />
        <Metric
          label="Átlagos ár-eltérés"
          value={`${sign(stats.avgSlippagePct, 1)}%`}
          sub={`${stats.worseCount} esetben rosszabb a naplózottnál`}
          tone={slipTone}
        />
        <Metric
          label="Valós ROI"
          value={stats.settled > 0 ? `${sign(stats.realRoiPct)}%` : '—'}
          sub={stats.settled > 0 ? `${sign(stats.realProfit, 0)} Ft` : 'nincs lezárt fogadás'}
        />
        <Metric
          label="Papír ROI (ugyanezek)"
          value={stats.settled > 0 ? `${sign(stats.paperRoiPct)}%` : '—'}
          sub="a naplózott áron, fix tét"
        />
      </div>

      {stats.byBookmaker.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase text-slate-500">
                <th className="py-1 pr-3 font-bold">Iroda</th>
                <th className="py-1 pr-3 font-bold text-right">Fogadás</th>
                <th className="py-1 pr-3 font-bold text-right">Ár-eltérés</th>
                <th className="py-1 font-bold text-right">Valós ROI</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {stats.byBookmaker.map((b) => (
                <tr key={b.bookmaker} className="border-t border-slate-800/80 text-slate-300">
                  <td className="py-1.5 pr-3">{b.bookmaker}</td>
                  <td className="py-1.5 pr-3 text-right">
                    {b.n} ({b.settled} lezárt)
                  </td>
                  <td className="py-1.5 pr-3 text-right">{sign(b.slippagePct, 1)}%</td>
                  <td className="py-1.5 text-right">{b.settled > 0 ? `${sign(b.roiPct)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-slate-600 mt-3 leading-snug">
        Az ár-eltérés a kapott és a naplózott szorzó különbsége (negatív: rosszabb ár, mint amit a protokoll feltételezett).
        A valós és a papír ROI közti különbség a késés, az árváltozás és a tétkorlát ára. Kis mintán a ROI zaj.
      </p>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; sub: string; tone?: string }> = ({ label, value, sub, tone }) => (
  <div className="min-w-0">
    <span className="text-[10px] uppercase font-bold text-slate-500 block">{label}</span>
    <span className={`text-xl sm:text-2xl font-black tabular-nums block ${tone ?? 'text-white'}`}>{value}</span>
    <span className="text-[10px] text-slate-500 block">{sub}</span>
  </div>
);
