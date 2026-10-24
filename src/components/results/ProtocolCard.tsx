import React from 'react';
import { ClipboardCheck, CheckCircle2, Circle } from 'lucide-react';
import type { GateStatus, ProtocolStats } from '../../services/bettingProtocol';

interface ProtocolCardProps {
  stats: ProtocolStats;
  /** A kártya címe (több protokoll egymás alatt) */
  title?: string;
  /** A szabály rövid leírása a kártya alján */
  rule?: string;
}

const RULE_EDGE =
  'valós, friss szorzó; ár-előny a piaci konszenzushoz +2%…+20%; modell–piac eltérés legfeljebb 5 pp; szorzó 1,50–4,00; naponta legfeljebb 5 tipp.';

const STATUS: Record<GateStatus, { label: string; tone: string }> = {
  collecting: { label: 'Adatgyűjtés', tone: 'bg-slate-800 text-slate-300 border-slate-700' },
  paper: { label: 'Csak papír', tone: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  ready: { label: 'Éles fogadásra alkalmas', tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
  stop: { label: 'Leállítandó', tone: 'bg-red-500/15 text-red-300 border-red-500/40' },
};

const sign = (x: number, d = 1) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;

/**
 * A fogadási protokoll mérése: a rögzített szabálynak megfelelő tippek papír-eredménye (fix 1 egységes tét),
 * a záró árhoz mért ár-előny és az éles fogadási kapu. A szabály verziózott: módosítása új mérést indít.
 */
export const ProtocolCard: React.FC<ProtocolCardProps> = ({ stats, title, rule = RULE_EDGE }) => {
  const st = STATUS[stats.gate.status];
  const hasSettled = stats.settled > 0;
  return (
    <div className="p-4 rounded-xl bg-mesh-dark border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
          <ClipboardCheck className="w-3.5 h-3.5 text-brand-400" />
          {title ?? 'Fogadási protokoll'} · v{stats.version}, papírkereskedés
        </span>
        <span className={`text-[11px] font-black px-2 py-0.5 rounded border ${st.tone}`}>{st.label}</span>
      </div>

      <p className="text-xs text-slate-400 mt-2">{stats.gate.summary}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
        <Metric label="Protokoll-tipp" value={String(stats.selected)} sub={`${stats.settled} lezárt, ${stats.pending} függő`} />
        <Metric
          label="Találati arány"
          value={hasSettled ? `${stats.winRatePct.toFixed(0)}%` : '—'}
          sub={hasSettled ? `${stats.won}/${stats.settled}` : 'nincs lezárt tipp'}
        />
        <Metric
          label="Papír ROI"
          value={hasSettled ? `${sign(stats.roiPct)}%` : '—'}
          sub={
            hasSettled
              ? `95%: ${sign(stats.roiCi95LowPct, 0)} … ${sign(stats.roiCi95HighPct, 0)}% · ${sign(stats.units, 1)} egység`
              : 'fix 1 egység / tipp'
          }
        />
        <Metric
          label="Átlagos CLV"
          value={stats.clv.n > 0 ? `${sign(stats.clv.meanClvPct, 2)}%` : '—'}
          sub={stats.clv.n > 0 ? `n = ${stats.clv.n}, átlagos belépő előny ${sign(stats.avgEdgePct, 1)}%` : 'a zárás után mérhető'}
        />
      </div>

      {stats.calibration.n > 0 && (
        <p className="mt-3 text-[11px] text-slate-400 tabular-nums">
          Kalibráció: becsült {stats.calibration.predictedPct.toFixed(1)}% · tényleges {stats.calibration.observedPct.toFixed(1)}% ({stats.calibration.n} lezárt tipp, z = {stats.calibration.z.toFixed(2)})
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {stats.gate.criteria.map((c) => (
          <li key={c.key} className="text-xs">
            <div className="flex items-start gap-2">
              {c.ok ? (
                <CheckCircle2 className="w-4 h-4 mt-px shrink-0 text-emerald-400" />
              ) : (
                <Circle className="w-4 h-4 mt-px shrink-0 text-slate-600" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap justify-between gap-x-3">
                  <span className="text-slate-300 font-semibold">{c.label}</span>
                  <span className="text-slate-400 tabular-nums">
                    {c.have} · cél: {c.need}
                  </span>
                </div>
                <div className="h-1 mt-1 rounded bg-slate-800 overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: `${Math.round(c.progress * 100)}%` }} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {stats.byMarket.some((m) => m.n > 0) && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-500">
          {stats.byMarket
            .filter((m) => m.n > 0)
            .map((m) => (
              <span key={m.label} className="tabular-nums">
                {m.label}: {m.n} tipp, {m.settled > 0 ? `ROI ${sign(m.roiPct, 0)}% (${m.settled} lezárt)` : 'még nincs lezárt'}
              </span>
            ))}
          {stats.maxDrawdownUnits > 0 && (
            <span className="tabular-nums">Legnagyobb visszaesés: {stats.maxDrawdownUnits.toFixed(1)} egység</span>
          )}
        </div>
      )}

      <p className="text-[10px] text-slate-600 mt-3 leading-snug">
        Szabály (ujjlenyomat {stats.fingerprint}): {rule} A küszöbök kezdeti becslések, módosításuk új protokoll-verziót és új
        mérést jelent. A mérés ezen az eszközön tárolt naplóból számol.
      </p>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
  <div className="min-w-0">
    <span className="text-[10px] uppercase font-bold text-slate-500 block">{label}</span>
    <span className="text-xl sm:text-2xl font-black text-white tabular-nums block">{value}</span>
    <span className="text-[10px] text-slate-500 block">{sub}</span>
  </div>
);
