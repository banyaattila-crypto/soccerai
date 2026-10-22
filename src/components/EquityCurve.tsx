import React, { useMemo } from 'react';
import { TrackedBet } from '../types/football';
import { computeEquityCurve } from '../services/equityCurve';

interface EquityCurveProps {
  bets: TrackedBet[];
  initialBankroll: number;
}

const W = 640;
const H = 200;
const PAD = { l: 8, r: 8, t: 12, b: 20 };

const fmt = (n: number) => `${Math.round(n).toLocaleString('hu-HU')} Ft`;

export const EquityCurve: React.FC<EquityCurveProps> = ({ bets, initialBankroll }) => {
  const curve = useMemo(() => computeEquityCurve(bets, initialBankroll), [bets, initialBankroll]);

  if (curve.settledCount < 2) {
    return (
      <div className="p-4 rounded-2xl bg-mesh-card border border-slate-800 text-xs text-slate-300">
        <span className="font-bold text-white block mb-1">Tőkegörbe</span>
        A görbe legalább 2 lezárt szelvény után jelenik meg. Jelenleg {curve.settledCount} lezárt szelvény van.
      </div>
    );
  }

  const values = curve.points.map((p) => p.bankroll);
  const min = Math.min(...values, initialBankroll);
  const max = Math.max(...values, initialBankroll);
  const span = Math.max(1, max - min);
  const x = (i: number) => PAD.l + (i / (curve.points.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b);

  const line = curve.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.bankroll).toFixed(1)}`).join(' ');
  const area = `${line} L${x(curve.points.length - 1).toFixed(1)},${H - PAD.b} L${x(0).toFixed(1)},${H - PAD.b} Z`;
  const last = curve.points[curve.points.length - 1];
  const up = last.bankroll >= initialBankroll;
  const stroke = up ? '#34d399' : '#f87171';
  const baseY = y(initialBankroll);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-mesh-card border border-slate-800 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-extrabold text-white">Tőkegörbe (lezárt szelvények)</h3>
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-300 font-mono">
          <span>Csúcs: {fmt(curve.peak)}</span>
          <span>Mélypont: {fmt(curve.trough)}</span>
          <span className={curve.maxDrawdownPct >= 25 ? 'text-red-300 font-bold' : ''}>
            Max. drawdown: {curve.maxDrawdownPct}%
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Tőkegörbe ${curve.settledCount} lezárt szelvényből. Kezdőtőke ${fmt(initialBankroll)}, jelenlegi ${fmt(last.bankroll)}, legnagyobb drawdown ${curve.maxDrawdownPct} százalék.`}
      >
        <defs>
          <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD.l} x2={W - PAD.r} y1={baseY} y2={baseY} stroke="#64748b" strokeDasharray="4 4" strokeWidth="1" />
        <text x={W - PAD.r} y={baseY - 4} textAnchor="end" fontSize="10" fill="#94a3b8">
          kezdőtőke
        </text>
        <path d={area} fill="url(#eqFill)" />
        <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
        <circle cx={x(curve.points.length - 1)} cy={y(last.bankroll)} r="3.5" fill={stroke} />
        <text x={PAD.l} y={H - 4} fontSize="10" fill="#94a3b8">
          0. szelvény
        </text>
        <text x={W - PAD.r} y={H - 4} textAnchor="end" fontSize="10" fill="#94a3b8">
          {curve.settledCount}. szelvény
        </text>
      </svg>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Kis mintán a görbe főleg szerencsét mutat, nem módszert. Értékelni csak több száz szelvény után érdemes.
      </p>
    </div>
  );
};
