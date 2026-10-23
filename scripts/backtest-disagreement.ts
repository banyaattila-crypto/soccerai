/**
 * Modell–piac eltérés elemzése: ha a modell és a piac erősen eltér, melyik jár közelebb az igazsághoz?
 *
 * Futtatás: npx tsx scripts/backtest-disagreement.ts
 * Kimenet: docs/backtest-disagreement.md
 *
 * Eltérés = max_k |modell_k − piaci záró fair_k| az 1X2 három kimenetelén (százalékpont). Az eredmény
 * adja az app "Modell ≠ piac" jelzésének küszöbét (src/utils/marketGap.ts).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseFootballDataCsv,
  walkForward,
  marketClose1x2,
  outcomeIndex,
  logLoss,
  type BacktestMatch,
} from '../src/services/backtestEngine';

const DATA_DIR = join(process.cwd(), 'data', 'backtest');
const TUNE = '2425';

const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.csv'));
const all: BacktestMatch[] = [];
for (const f of files) {
  const [league, season] = f.replace('.csv', '').split('_');
  all.push(...parseFootballDataCsv(readFileSync(join(DATA_DIR, f), 'utf8'), league, season));
}
const tuneStart = Math.min(...all.filter((m) => m.season === TUNE).map((m) => m.ts));
const records = walkForward(all, { predictFromTs: tuneStart });

const BUCKETS: [number, number][] = [
  [0, 3],
  [3, 5],
  [5, 8],
  [8, 12],
  [12, 100],
];

interface Row {
  gap: number;
  llModel: number;
  llMarket: number;
}
const rows: Row[] = [];
for (const r of records) {
  const close = marketClose1x2(r.match);
  if (!close) continue;
  const idx = outcomeIndex(r.match.hg, r.match.ag);
  const gap = Math.max(...r.model.map((p, k) => Math.abs(p - close[k]))) * 100;
  rows.push({ gap, llModel: logLoss(r.model, idx), llMarket: logLoss(close, idx) });
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const se = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1) / Math.max(1, xs.length));
};

const lines: string[] = [];
lines.push('# Modell–piac eltérés elemzése\n');
lines.push(`Generálva: ${new Date().toISOString()}. Forrás: football-data.co.uk, 5 liga, walk-forward predikciók (${rows.length} meccs, hangolási + holdout szezon). Záró referencia: Pinnacle (Shin).\n`);
lines.push('Eltérés = max_k |modell_k − piaci fair_k| az 1X2 három kimenetelén, százalékpontban. Rés = modell log-loss − piac log-loss meccsenként (pozitív: a piac pontosabb). A "piac jobb" a meccsek aránya, ahol a piac log-lossa kisebb.\n');
lines.push('| Eltérés (pp) | N | Modell LL | Piac LL | Átlagos rés ± SE | Piac jobb |');
lines.push('| :--- | ---: | ---: | ---: | ---: | ---: |');
const stat: { lo: number; hi: number; n: number; gap: number; se: number; better: number }[] = [];
for (const [lo, hi] of BUCKETS) {
  const rs = rows.filter((x) => x.gap >= lo && x.gap < hi);
  if (rs.length === 0) continue;
  const diffs = rs.map((x) => x.llModel - x.llMarket);
  const better = rs.filter((x) => x.llMarket < x.llModel).length / rs.length;
  const label = hi >= 100 ? `${lo}+` : `${lo}–${hi}`;
  lines.push(
    `| ${label} | ${rs.length} | ${mean(rs.map((x) => x.llModel)).toFixed(4)} | ${mean(rs.map((x) => x.llMarket)).toFixed(4)} | ${mean(diffs).toFixed(4)} ± ${se(diffs).toFixed(4)} | ${(better * 100).toFixed(1)}% |`
  );
  stat.push({ lo, hi, n: rs.length, gap: mean(diffs), se: se(diffs), better });
}
lines.push('');
lines.push('Olvasat: ha az átlagos rés minden sávban pozitív, és az eltéréssel nő, akkor a modell és a piac közti nagy eltérés a modell hibájának jele, nem rejtett értéké.\n');
writeFileSync(join(process.cwd(), 'docs', 'backtest-disagreement.md'), lines.join('\n'));
console.log(lines.join('\n'));
