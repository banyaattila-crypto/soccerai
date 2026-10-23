import React from 'react';
import { FlaskConical } from 'lucide-react';
import report from '../data/backtestReport.json';
import { ReliabilityChart } from './ReliabilityChart';
import type { ReliabilityBin } from '../services/calibrationService';

interface Scores {
  n: number;
  logLoss: number;
  brier: number;
  rps: number;
}

const f4 = (x: number) => x.toFixed(4);
const f1 = (x: number) => x.toFixed(1);

/**
 * Valós walk-forward backtest eredménye (scripts/backtest.ts generálja a src/data/backtestReport.json fájlt).
 * Ez váltja a korábbi, kézzel írt illusztratív mintaadatsort.
 */
export const BacktestSection: React.FC = () => {
  const s = report.holdout.scores as { model: Scores; market: Scores; blend: Scores; naive: Scores };
  const bet = report.betting.holdout.model.find((b) => b.threshold === 0.02) ?? report.betting.holdout.model[0];
  const modelBeatsNaive = s.model.logLoss < s.naive.logLoss;
  const marketBeatsModel = s.market.logLoss < s.model.logLoss;
  const negativeEdge = bet.roiPct < 0 && bet.zScore < -1.645;
  const w = report.weights.modelWeight1x2;
  const bins = report.reliability.model as ReliabilityBin[];

  const rows: { name: string; v: Scores; bold?: boolean }[] = [
    { name: 'Naiv (kimenetel-gyakoriság)', v: s.naive },
    { name: 'Modell (Dixon–Coles)', v: s.model },
    { name: 'Piac (Pinnacle záró, Shin de-vig)', v: s.market, bold: true },
    { name: `Keverék (modell súlya ${w})`, v: s.blend },
  ];

  return (
    <div className="p-5 rounded-2xl bg-mesh-card border border-slate-800 space-y-5 md:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-sky-400 font-extrabold text-base">
          <FlaskConical className="w-5 h-5" aria-hidden="true" />
          <h4>6. Valós walk-forward backtest: modell vs. piac</h4>
        </div>
        <span className="text-[11px] font-mono text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
          {report.leagues.length} liga, {report.seasons.holdout} holdout, N = {report.holdout.n}
        </span>
      </div>

      <div
        role="status"
        className={`p-4 rounded-xl border text-xs leading-relaxed ${
          negativeEdge || marketBeatsModel
            ? 'bg-amber-500/10 border-amber-500/40 border-dashed text-amber-100'
            : 'bg-brand-500/10 border-brand-500/40 text-brand-100'
        }`}
      >
        <strong className="block text-sm mb-1">
          {marketBeatsModel
            ? 'Nincs igazolt piaci előny: a modell a záró piacnál rosszabb előrejelző.'
            : 'A modell a záró piac szintjén van.'}
        </strong>
        {modelBeatsNaive
          ? `A modell jobb a naiv gyakoriságnál (log-loss ${f4(s.model.logLoss)} vs. ${f4(s.naive.logLoss)}), tehát valódi információt hordoz, `
          : 'A modell nem jobb a naiv gyakoriságnál, '}
        de a Pinnacle záró árazásánál ({f4(s.market.logLoss)}) gyengébb. A nyers modellből számolt "+EV" fogadások a
        nyitó Pinnacle szorzón átlagosan <strong>{f1(bet.claimedEvPct)}%</strong> élt állítottak, a valós hozam
        <strong> {f1(bet.roiPct)}%</strong> lett ({bet.bets} fogadás, z = {bet.zScore.toFixed(2)}).
        Ezért a valós szorzónál az EV és a Kelly a piaci referenciához mér (a modell súlya a keverékben: {w}), és
        piaci referencia nélküli piacra (pl. BTTS) nincs EV.
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] text-left border border-slate-800 rounded-xl overflow-hidden">
          <caption className="sr-only">1X2 pontosság a holdout szezonon</caption>
          <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="p-2.5">Forrás</th>
              <th className="p-2.5">Log-loss</th>
              <th className="p-2.5">Brier</th>
              <th className="p-2.5">RPS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className={`p-2.5 ${r.bold ? 'font-bold text-white' : 'text-slate-300'}`}>{r.name}</td>
                <td className="p-2.5 font-mono text-slate-200">{f4(r.v.logLoss)}</td>
                <td className="p-2.5 font-mono text-slate-200">{f4(r.v.brier)}</td>
                <td className="p-2.5 font-mono text-slate-200">{f4(r.v.rps)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-400">
        Kisebb érték a jobb. Az RPS a 1X2 sorrendi jellegét is figyelembe veszi (hazai, döntetlen, vendég).
        Over/Under 2.5 log-loss: modell {f4(report.holdout.totals.model)}, piac {f4(report.holdout.totals.market)}.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] text-left border border-slate-800 rounded-xl overflow-hidden">
          <caption className="sr-only">Fogadási szimuláció a nyers modellel, nyitó Pinnacle szorzón</caption>
          <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="p-2.5">Nyers modell, küszöb</th>
              <th className="p-2.5">Fogadás</th>
              <th className="p-2.5">Állított EV</th>
              <th className="p-2.5">Valós ROI</th>
              <th className="p-2.5">CLV</th>
              <th className="p-2.5">z</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
            {report.betting.holdout.model.map((b) => (
              <tr key={b.threshold}>
                <td className="p-2.5 text-slate-300">EV &gt; {Math.round(b.threshold * 100)}%</td>
                <td className="p-2.5 font-mono text-slate-200">{b.bets}</td>
                <td className="p-2.5 font-mono text-slate-200">+{f1(b.claimedEvPct)}%</td>
                <td className="p-2.5 font-mono text-red-300 font-bold">{f1(b.roiPct)}%</td>
                <td className="p-2.5 font-mono text-slate-200">{f1(b.clvPct)}%</td>
                <td className="p-2.5 font-mono text-slate-200">{b.zScore.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-400">
        Viszonyítás: minden kimenetelre fogadva a hozam {f1(report.betting.baselineBetAllRoiPct)}% (a piac árrése).
        A CLV a nyitó szorzó és a záró, de-vigelt fair ár különbsége: tartósan pozitív CLV lenne az egyetlen megbízható
        jele annak, hogy az információ jobb a piacénál.
      </p>

      <div className="space-y-2">
        <span className="text-xs font-bold text-white block">
          Megbízhatósági diagram (a modell esélyei, holdout, {bins.reduce((a, b) => a + b.count, 0)} kimenetel)
        </span>
        <ReliabilityChart bins={bins} />
      </div>

      <details className="text-[11px] text-slate-300">
        <summary className="cursor-pointer font-bold text-slate-200">Hangolás és módszertan</summary>
        <div className="mt-2 space-y-1.5 leading-relaxed">
          <p>
            A keverési súlyt a {report.seasons.tune} szezonon hangoltuk (log-loss a modell súlyának függvényében:{' '}
            {report.weights.curve1x2.map((c) => `w=${c.w}: ${f4(c.logLoss)}`).join('; ')}), és a {report.seasons.holdout}{' '}
            szezonon mértük. A görbe végig nő: a modell a záró piachoz képest nem ad pluszinformációt.
          </p>
          <p>
            Walk-forward: egy meccset csak a nála korábbi meccsekből (hetente újraillesztett) modell jósol, a kézi
            klub-priorok nélkül. Forrás: {report.source}. Ligák: {report.leagues.join(', ')}. Generálva:{' '}
            {report.generatedAt.slice(0, 10)}. Újrafuttatás: <code>npx tsx scripts/backtest.ts</code>.
          </p>
        </div>
      </details>
    </div>
  );
};
