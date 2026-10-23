import React from 'react';
import { ReliabilityBin } from '../services/calibrationService';

interface ReliabilityChartProps {
  bins: ReliabilityBin[];
}

const SIZE = 260;
const PAD = 34;

/**
 * Megbízhatósági diagram: x = átlagos modell-esély, y = tényleges találati arány.
 * Az átló a tökéletes kalibráció. A pont mérete a mintaelemszámmal arányos.
 */
export const ReliabilityChart: React.FC<ReliabilityChartProps> = ({ bins }) => {
  const used = bins.filter((b) => b.count > 0);
  const maxCount = Math.max(1, ...used.map((b) => b.count));
  const scale = (pct: number) => PAD + (pct / 100) * (SIZE - PAD * 2);
  const sy = (pct: number) => SIZE - PAD - (pct / 100) * (SIZE - PAD * 2);
  const ticks = [0, 25, 50, 75, 100];

  return (
    <figure className="space-y-1.5">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[320px] h-auto mx-auto"
        role="img"
        aria-label={`Megbízhatósági diagram ${used.length} sávval. ${used
          .map((b) => `${b.binLabel}: modell ${b.avgPredictedProb} százalék, tényleges ${b.observedHitRate} százalék, ${b.count} meccs`)
          .join('; ')}`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={scale(t)} x2={scale(t)} y1={sy(0)} y2={sy(100)} stroke="#1e293b" strokeWidth="1" />
            <line x1={scale(0)} x2={scale(100)} y1={sy(t)} y2={sy(t)} stroke="#1e293b" strokeWidth="1" />
            <text x={scale(t)} y={SIZE - PAD + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {t}
            </text>
            <text x={PAD - 6} y={sy(t) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
              {t}
            </text>
          </g>
        ))}
        <line x1={scale(0)} y1={sy(0)} x2={scale(100)} y2={sy(100)} stroke="#64748b" strokeDasharray="4 4" strokeWidth="1.5" />
        {used.length > 1 && (
          <polyline
            points={used.map((b) => `${scale(b.avgPredictedProb)},${sy(b.observedHitRate)}`).join(' ')}
            fill="none"
            stroke="#6f8cff"
            strokeWidth="1.5"
          />
        )}
        {used.map((b) => (
          <circle
            key={b.binLabel}
            cx={scale(b.avgPredictedProb)}
            cy={sy(b.observedHitRate)}
            r={4 + (b.count / maxCount) * 6}
            fill={b.isWellCalibrated ? '#6f8cff' : '#fbbf24'}
            fillOpacity="0.85"
            stroke="#0f172a"
            strokeWidth="1"
          >
            <title>{`${b.binLabel}: modell ${b.avgPredictedProb}%, tényleges ${b.observedHitRate}% (${b.count} meccs)`}</title>
          </circle>
        ))}
        <text x={SIZE / 2} y={SIZE - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">
          Modell-esély (%)
        </text>
        <text x="9" y={SIZE / 2} fontSize="9" fill="#94a3b8" transform={`rotate(-90 9 ${SIZE / 2})`} textAnchor="middle">
          Tényleges találat (%)
        </text>
      </svg>
      <figcaption className="text-[11px] text-slate-400 text-center">
        Az átlóhoz közeli pontok jól kalibráltak. Az átló feletti pont alulbecslést, az alatti túlbecslést jelent.
        Kis elemszámnál (kis pont) az eltérés nem megbízható.
      </figcaption>
    </figure>
  );
};
