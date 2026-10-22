/**
 * Modell-hiperparaméterek (ξ időlecsengés, K regularizáció) hangolása a walk-forward backtesten.
 *
 * Elv: a paramétert a "tune" szezon (2024/25) 1X2 log-loss-a alapján választjuk, és a "holdout" szezonon
 * (2025/26) ellenőrizzük, hogy a javulás nem túlillesztés.
 *
 * Futtatás: npx tsx scripts/backtest-tune.ts
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseFootballDataCsv,
  walkForward,
  evaluate1x2,
  type BacktestMatch,
} from '../src/services/backtestEngine';

const DATA_DIR = join(process.cwd(), 'data', 'backtest');
const TUNE = '2425';
const HOLDOUT = '2526';

function load(): BacktestMatch[] {
  const all: BacktestMatch[] = [];
  for (const f of readdirSync(DATA_DIR).filter((x) => x.endsWith('.csv'))) {
    const [league, season] = f.replace('.csv', '').split('_');
    all.push(...parseFootballDataCsv(readFileSync(join(DATA_DIR, f), 'utf8'), league, season));
  }
  return all;
}

const XIS = (process.env.XIS ?? '0.0005,0.0015,0.0025,0.004,0.007').split(',').map(Number);
const KS = (process.env.KS ?? '4,8,14,24,40').split(',').map(Number);
const REFIT = Number(process.env.REFIT ?? 14);

const matches = load();
const tuneStart = Math.min(...matches.filter((m) => m.season === TUNE).map((m) => m.ts));

const f4 = (x: number) => x.toFixed(4);
const rows: { xi: number; k: number; tune: number; hold: number }[] = [];

for (const xi of XIS) {
  for (const k of KS) {
    const recs = walkForward(matches, { predictFromTs: tuneStart, xi, priorStrength: k, refitEveryDays: REFIT });
    const tune = evaluate1x2(
      recs.filter((r) => r.match.season === TUNE),
      0
    );
    const hold = evaluate1x2(
      recs.filter((r) => r.match.season === HOLDOUT),
      0
    );
    rows.push({ xi, k, tune: tune.model.logLoss, hold: hold.model.logLoss });
    console.log(`xi=${xi} K=${k}  tune=${f4(tune.model.logLoss)}  holdout=${f4(hold.model.logLoss)}  (piac holdout: ${f4(hold.market.logLoss)})`);
  }
}

const best = [...rows].sort((a, b) => a.tune - b.tune)[0];
const base = rows.find((r) => r.xi === 0.0025 && r.k === 14);
console.log(`\nLegjobb a tune szezonon: xi=${best.xi}, K=${best.k} (tune ${f4(best.tune)}, holdout ${f4(best.hold)})`);
if (base) console.log(`Jelenlegi (xi=0.0025, K=14): tune ${f4(base.tune)}, holdout ${f4(base.hold)}`);

// ---------------------------------------------------------------------------
// Utólagos kalibráció: döntetlen-korrekció (d) és hőmérséklet (τ), a tune szezonon választva
// ---------------------------------------------------------------------------

import { logLoss, outcomeIndex, type PredictionRecord } from '../src/services/backtestEngine';

function adjust(p: [number, number, number], d: number, tau: number): number[] {
  const q = [Math.pow(p[0], tau), Math.pow(p[1], tau) * d, Math.pow(p[2], tau)];
  const s = q[0] + q[1] + q[2];
  return q.map((x) => x / s);
}

function meanLL(recs: PredictionRecord[], d: number, tau: number): number {
  let sum = 0;
  let n = 0;
  for (const r of recs) {
    sum += logLoss(adjust(r.model, d, tau), outcomeIndex(r.match.hg, r.match.ag));
    n++;
  }
  return sum / Math.max(1, n);
}

const BEST_XI = Number(process.env.BEST_XI ?? best.xi);
const BEST_K = Number(process.env.BEST_K ?? best.k);
const recsBest = walkForward(matches, { predictFromTs: tuneStart, xi: BEST_XI, priorStrength: BEST_K, refitEveryDays: 7 });
const tuneRecs = recsBest.filter((r) => r.match.season === TUNE);
const holdRecs = recsBest.filter((r) => r.match.season === HOLDOUT);

// osztályonkénti kalibráció (átlagos modell-esély vs. tényleges gyakoriság), holdout
const names = ['hazai', 'döntetlen', 'vendég'];
for (let k = 0; k < 3; k++) {
  const pred = holdRecs.reduce((a, r) => a + r.model[k], 0) / holdRecs.length;
  const obs = holdRecs.filter((r) => outcomeIndex(r.match.hg, r.match.ag) === k).length / holdRecs.length;
  console.log(`Holdout ${names[k]}: modell ${(pred * 100).toFixed(1)}%, tényleges ${(obs * 100).toFixed(1)}%`);
}

let bestAdj = { d: 1, tau: 1, ll: Infinity };
for (let d = 0.9; d <= 1.3001; d += 0.025) {
  for (let tau = 0.8; tau <= 1.2001; tau += 0.05) {
    const ll = meanLL(tuneRecs, d, tau);
    if (ll < bestAdj.ll) bestAdj = { d, tau, ll };
  }
}
console.log(
  `\nUtólagos kalibráció (tune-on választva): d=${bestAdj.d.toFixed(3)}, tau=${bestAdj.tau.toFixed(2)}; ` +
    `tune ${f4(meanLL(tuneRecs, 1, 1))} -> ${f4(bestAdj.ll)}, holdout ${f4(meanLL(holdRecs, 1, 1))} -> ${f4(meanLL(holdRecs, bestAdj.d, bestAdj.tau))}`
);
