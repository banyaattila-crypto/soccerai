import React from 'react';
import { Activity, Target } from 'lucide-react';
import type { ClvStats, ClvVerdict } from '../../services/clvService';
import { CLV_MIN_SAMPLES_EDGE, CLV_MIN_SAMPLES_VERDICT } from '../../services/clvService';

interface ClvKpiRowProps {
  clv: ClvStats;
  real: { n: number; roiPct: number; settledN: number };
  /** Az összes hitelesített (naplózott) tipp száma, a szimulált szorzón készültekkel együtt */
  totalAudited: number;
}

const VERDICT_TEXT: Record<ClvVerdict, { text: string; tone: string }> = {
  no_data: {
    text: 'Még nincs mérhető tipp: valós szorzó és legalább egy kezdés előtti frissítés kell hozzá.',
    tone: 'text-slate-400',
  },
  insufficient: {
    text: `Kevés minta (n < ${CLV_MIN_SAMPLES_VERDICT}): nem értelmezhető.`,
    tone: 'text-slate-400',
  },
  unproven: { text: 'Nincs bizonyított ár-előny: a konfidencia-intervallum tartalmazza a nullát.', tone: 'text-amber-300' },
  edge_likely: {
    text: `Valószínű ár-előny a záró árhoz (n ≥ ${CLV_MIN_SAMPLES_EDGE}, az intervallum alsó széle > 0).`,
    tone: 'text-emerald-300',
  },
  negative: { text: 'Negatív: a tippek a záró árnál rosszabb áron készültek.', tone: 'text-red-300' },
};

const sign = (x: number, d = 2) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}%`;

/**
 * A valós szorzón naplózott tippek mérése: darabszám, ROI és a záró árhoz mért CLV. Az eredmény (nyert/vesztett)
 * rövid távon zaj; a CLV az egyetlen gyors, megbízható jele annak, hogy a tippek a piacnál jobb áron készülnek.
 */
export const ClvKpiRow: React.FC<ClvKpiRowProps> = ({ clv, real, totalAudited }) => {
  const verdict = VERDICT_TEXT[clv.verdict];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {/* Valós szorzós tippek */}
      <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
        <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          Valós szorzón naplózott tippek
        </span>
        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-2xl sm:text-3xl font-black text-white">{real.n}</span>
          <span className="text-xs text-slate-400 font-mono">
            / {totalAudited} naplózott ({totalAudited > 0 ? Math.round((real.n / totalAudited) * 100) : 0}%)
          </span>
        </div>
        <span className="text-[10px] text-slate-500 mt-1 block">
          {real.settledN > 0
            ? `${real.settledN} lezárt, ROI ${sign(real.roiPct, 1)} (10 000 Ft egységtét). ${
                real.settledN < 100 ? 'Kevés minta: a ROI zaj, a CLV a mérvadó.' : ''
              }`
            : 'Egy tipp akkor számít, ha a naplózáskor érvényes valós szorzó volt. A szimulált szorzós tippek a fenti kalibrációs mutatót adják.'}
        </span>
      </div>

      {/* CLV */}
      <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800 flex flex-col justify-between">
        <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          CLV a záró fair árhoz
        </span>
        <div className="flex items-baseline gap-3 mt-2 flex-wrap">
          <span
            className={`text-2xl sm:text-3xl font-black font-mono ${
              clv.n === 0 ? 'text-slate-500' : clv.meanClvPct >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {clv.n > 0 ? sign(clv.meanClvPct) : '—'}
          </span>
          {clv.n > 0 && (
            <span className="text-xs text-slate-400 font-mono">
              n = {clv.n} · 95%: [{sign(clv.ci95LowPct)}; {sign(clv.ci95HighPct)}]
            </span>
          )}
        </div>
        <span className={`text-[11px] mt-1 block ${verdict.tone}`}>{verdict.text}</span>
        {clv.n > 0 && (
          <span
            className="text-[10px] text-slate-500 mt-1 block"
            title="Ár-előny a naplózáskor: a legjobb bukméker szorzója a konszenzus fair árához képest (ez az árverseny, nem modell-előny). Piac-mozgás: a de-vigelt piaci esély relatív változása a tipp irányába a naplózás és a zárás között; ez jelzi, hogy a piac utólag igazat adott-e a tippnek."
          >
            Ár-előny naplózáskor: {sign(clv.meanShopPct)} · Piac-mozgás a tipp felé: {sign(clv.meanDriftPct)} · pozitív CLV:{' '}
            {Math.round(clv.positiveShare * 100)}%
          </span>
        )}
      </div>
    </div>
  );
};
